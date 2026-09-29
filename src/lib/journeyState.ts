import 'server-only';

import { cache } from 'react';
import { getDb } from '@/db';
import {
  coursePrerequisites,
  courses,
  lessonProgress,
  lessons,
  rewardClaims,
  rewards,
  user,
} from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { canAccessCourse, getAccessibleCourseIds } from '@/lib/access';
import {
  OPEN,
  evaluateUnlock,
  hasRequirements,
  type MemberProgress,
  type Requirement,
  type UnlockStatus,
} from '@/lib/journey';

const db = () => getDb(process.env.DB as unknown as D1Database);

export type CourseJourney = UnlockStatus & { hidden: boolean; title: string; published: boolean };

/** Ids of the courses whose every lesson the member has completed. */
export async function loadCompletedCourseIds(userId: string): Promise<Set<string>> {
  const rows = await db()
    .select({ courseId: lessons.courseId, isCompleted: lessonProgress.isCompleted })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.userId, userId))
    );

  const totals = new Map<string, { total: number; done: number }>();
  for (const row of rows as Array<{ courseId: string; isCompleted: boolean | null }>) {
    const entry = totals.get(row.courseId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (row.isCompleted) entry.done += 1;
    totals.set(row.courseId, entry);
  }

  const completed = new Set<string>();
  for (const [courseId, { total, done }] of totals) {
    if (total > 0 && total === done) completed.add(courseId);
  }
  return completed;
}

async function loadProgress(userId: string): Promise<MemberProgress> {
  const rows = await db()
    .select({ totalPoints: user.totalPoints })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return {
    completedCourseIds: await loadCompletedCourseIds(userId),
    totalPoints: rows[0]?.totalPoints ?? 0,
  };
}

/**
 * Journey status of every course for one member. Uncached: call it again
 * after a write to see what the write opened up.
 */
export async function buildCourseJourneys(userId: string): Promise<Map<string, CourseJourney>> {
  const all: Array<{
    id: string;
    title: string;
    status: string;
    unlockCompletedCourses: number | null;
    unlockPoints: number | null;
    isHidden: boolean;
  }> = await db()
    .select({
      id: courses.id,
      title: courses.title,
      status: courses.status,
      unlockCompletedCourses: courses.unlockCompletedCourses,
      unlockPoints: courses.unlockPoints,
      isHidden: courses.isHidden,
    })
    .from(courses);
  const edges: Array<{ courseId: string; requiredCourseId: string }> = await db()
    .select({ courseId: coursePrerequisites.courseId, requiredCourseId: coursePrerequisites.requiredCourseId })
    .from(coursePrerequisites);

  const prerequisites = new Map<string, string[]>();
  for (const e of edges) {
    const list = prerequisites.get(e.courseId) ?? [];
    list.push(e.requiredCourseId);
    prerequisites.set(e.courseId, list);
  }

  const rules = all.map((c) => ({
    course: c,
    rule: {
      prerequisiteIds: prerequisites.get(c.id) ?? [],
      requiredCompletedCourses: c.unlockCompletedCourses,
      requiredPoints: c.unlockPoints,
    },
  }));

  const result = new Map<string, CourseJourney>();
  // Most sites use no journey rules at all; skip the progress queries then.
  if (!rules.some(({ rule }) => hasRequirements(rule))) {
    for (const c of all) {
      result.set(c.id, { ...OPEN, hidden: false, title: c.title, published: c.status === 'PUBLISHED' });
    }
    return result;
  }

  const progress = await loadProgress(userId);
  const titles = new Map(all.map((c) => [c.id, c.title]));
  for (const { course, rule } of rules) {
    const status = evaluateUnlock(rule, progress, (id) => titles.get(id));
    // A hidden course with nothing to unlock it by is simply visible.
    result.set(course.id, {
      ...status,
      hidden: course.isHidden && !status.unlocked,
      title: course.title,
      published: course.status === 'PUBLISHED',
    });
  }
  return result;
}

/** Memoized per request; the list page, layout and actions all ask. */
export const getCourseJourneys = cache(buildCourseJourneys);

function journeyOf(map: Map<string, CourseJourney>, courseId: string): CourseJourney {
  return map.get(courseId) ?? { ...OPEN, hidden: false, title: '', published: false };
}

export async function getCourseJourney(userId: string, courseId: string): Promise<CourseJourney> {
  return journeyOf(await getCourseJourneys(userId), courseId);
}

/**
 * Plan access *and* journey unlock: whether the member may read the course
 * right now. Everything that serves course content goes through this.
 */
export async function canOpenCourse(
  d1: D1Database,
  userId: string,
  course: { id: string; requiredPlanId: string | null }
): Promise<boolean> {
  if (!(await canAccessCourse(d1, userId, course))) return false;
  return (await getCourseJourney(userId, course.id)).unlocked;
}

/** Batch version of canOpenCourse. */
export async function getOpenCourseIds(
  d1: D1Database,
  userId: string,
  list: Array<{ id: string; requiredPlanId: string | null }>
): Promise<Set<string>> {
  const accessible = await getAccessibleCourseIds(d1, userId, list);
  const journeys = await getCourseJourneys(userId);
  return new Set([...accessible].filter((id) => journeyOf(journeys, id).unlocked));
}

// ------------------------------------------------------------------ rewards

export type MemberReward = {
  id: string;
  icon: string;
  title: string;
  description: string | null;
  requiredCompletedCourses: number | null;
  requiredPoints: number | null;
  status: UnlockStatus;
  claimedAt: string | null;
  /** Only present once claimed. */
  content: string | null;
  url: string | null;
};

/**
 * Active perks the member can see: every non-hidden one, plus hidden ones
 * they already qualify for. The payload of an unclaimed perk never leaves
 * the server.
 */
export async function buildMemberRewards(userId: string): Promise<MemberReward[]> {
  const rows: Array<typeof rewards.$inferSelect> = await db()
    .select()
    .from(rewards)
    .where(eq(rewards.isActive, true))
    .orderBy(asc(rewards.sortOrder), asc(rewards.createdAt));
  if (rows.length === 0) return [];

  const claims: Array<{ rewardId: string; claimedAt: string }> = await db()
    .select({ rewardId: rewardClaims.rewardId, claimedAt: rewardClaims.claimedAt })
    .from(rewardClaims)
    .where(eq(rewardClaims.userId, userId));
  const claimedAt = new Map(claims.map((c) => [c.rewardId, c.claimedAt]));

  const progress = await loadProgress(userId);

  return rows.flatMap((r) => {
    const status = evaluateUnlock(
      { requiredCompletedCourses: r.requiredCompletedCourses, requiredPoints: r.requiredPoints },
      progress
    );
    const claimed = claimedAt.get(r.id) ?? null;
    if (r.isHidden && !status.unlocked && !claimed) return [];
    return [{
      id: r.id,
      icon: r.icon,
      title: r.title,
      description: r.description,
      requiredCompletedCourses: r.requiredCompletedCourses,
      requiredPoints: r.requiredPoints,
      status,
      claimedAt: claimed,
      content: claimed ? r.content : null,
      url: claimed ? r.url : null,
    }];
  });
}

export const getMemberRewards = cache(buildMemberRewards);

export type Unlocked = { courses: Array<{ id: string; title: string }>; rewards: Array<{ id: string; title: string; icon: string }> };

/**
 * What became available between two snapshots — shown to the member right
 * after the lesson or login that did it.
 */
export function diffUnlocks(
  before: { courses: Map<string, CourseJourney>; rewards: MemberReward[] },
  after: { courses: Map<string, CourseJourney>; rewards: MemberReward[] }
): Unlocked {
  const newCourses: Unlocked['courses'] = [];
  for (const [id, status] of after.courses) {
    const was = before.courses.get(id);
    if (status.published && status.unlocked && was && !was.unlocked) {
      newCourses.push({ id, title: status.title });
    }
  }
  const wasReady = new Set(before.rewards.filter((r) => r.status.unlocked).map((r) => r.id));
  const newRewards = after.rewards
    .filter((r) => r.status.unlocked && !wasReady.has(r.id) && !r.claimedAt)
    .map((r) => ({ id: r.id, title: r.title, icon: r.icon }));
  return { courses: newCourses, rewards: newRewards };
}

export type { Requirement };
