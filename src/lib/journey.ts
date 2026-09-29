/**
 * Pure rules behind the customer journey: which courses and perks a member
 * has opened up so far, and what is still standing in the way.
 *
 * Kept free of database access, like src/lib/points.ts, so the rules can be
 * tested directly. src/lib/journeyState.ts feeds them from D1.
 */

export type UnlockRule = {
  /** Course ids that must each be completed first. */
  prerequisiteIds?: string[];
  /** Number of completed courses needed. Null/0 means no requirement. */
  requiredCompletedCourses?: number | null;
  /** Lifetime points needed. Points are never spent, so this is a threshold. */
  requiredPoints?: number | null;
};

export type MemberProgress = {
  completedCourseIds: ReadonlySet<string>;
  totalPoints: number;
};

export type Requirement =
  | { kind: 'course'; courseId: string; title: string; met: boolean }
  | { kind: 'courses'; required: number; current: number; met: boolean }
  | { kind: 'points'; required: number; current: number; met: boolean };

export type UnlockStatus = {
  unlocked: boolean;
  /** Every requirement, met or not, in display order. */
  requirements: Requirement[];
};

export const OPEN: UnlockStatus = { unlocked: true, requirements: [] };

export function hasRequirements(rule: UnlockRule): boolean {
  return (
    (rule.prerequisiteIds?.length ?? 0) > 0 ||
    (rule.requiredCompletedCourses ?? 0) > 0 ||
    (rule.requiredPoints ?? 0) > 0
  );
}

export function evaluateUnlock(
  rule: UnlockRule,
  progress: MemberProgress,
  titleOf: (courseId: string) => string | undefined = () => undefined
): UnlockStatus {
  const requirements: Requirement[] = [];

  for (const courseId of rule.prerequisiteIds ?? []) {
    const title = titleOf(courseId);
    // A prerequisite that no longer exists cannot be completed; it must not
    // lock the course forever. Deletion cascades, so this is only a race.
    if (title === undefined) continue;
    requirements.push({ kind: 'course', courseId, title, met: progress.completedCourseIds.has(courseId) });
  }

  const courses = rule.requiredCompletedCourses ?? 0;
  if (courses > 0) {
    const current = progress.completedCourseIds.size;
    requirements.push({ kind: 'courses', required: courses, current, met: current >= courses });
  }

  const points = rule.requiredPoints ?? 0;
  if (points > 0) {
    const current = Math.max(0, progress.totalPoints || 0);
    requirements.push({ kind: 'points', required: points, current, met: current >= points });
  }

  return { unlocked: requirements.every((r) => r.met), requirements };
}

/** One line per unmet requirement, for a locked card or page. */
export function describeRequirement(r: Requirement): string {
  switch (r.kind) {
    case 'course':
      return `「${r.title}」を読了`;
    case 'courses':
      return `講座を${r.required}つ読了（あと${Math.max(0, r.required - r.current)}つ）`;
    case 'points':
      return `${r.required.toLocaleString()}pt 到達（あと${Math.max(0, r.required - r.current).toLocaleString()}pt）`;
  }
}

/**
 * True when making `courseId` require `prerequisiteIds` would close a loop —
 * A needs B and B needs A — which would leave every course in it locked
 * forever. `edges` is the current prerequisite graph (courseId -> required).
 */
export function wouldCreateCycle(
  edges: ReadonlyArray<{ courseId: string; requiredCourseId: string }>,
  courseId: string,
  prerequisiteIds: readonly string[]
): boolean {
  if (prerequisiteIds.includes(courseId)) return true;

  const requires = new Map<string, string[]>();
  for (const e of edges) {
    if (e.courseId === courseId) continue; // being replaced
    const list = requires.get(e.courseId) ?? [];
    list.push(e.requiredCourseId);
    requires.set(e.courseId, list);
  }

  // A cycle exists iff courseId is reachable from one of its new prerequisites.
  const seen = new Set<string>();
  const stack = [...prerequisiteIds];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === courseId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(requires.get(current) ?? []));
  }
  return false;
}

/** Positive whole number from a form field, or null for blank/zero/junk. */
export function parseThreshold(raw: FormDataEntryValue | null | undefined): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}
