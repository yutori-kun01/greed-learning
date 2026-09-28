/**
 * Pure rules behind points, levels, streaks and badges.
 *
 * Kept free of database access so the arithmetic can be tested directly —
 * these numbers decide what members see about their own effort, so quietly
 * getting them wrong is worse than not showing them at all.
 */

export const POINTS = {
  LESSON_COMPLETE: 10,
  COURSE_COMPLETE: 100,
  /** Awarded once when a streak reaches one of STREAK_MILESTONES. */
  STREAK_MILESTONE: 50,
} as const;

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

/**
 * Points needed to *reach* each level. Deliberately front-loaded: the first
 * few levels should arrive while a member is still deciding whether the site
 * is worth their time.
 */
const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000, 5200, 6600, 8200, 10000,
];

/** Beyond the table, each level costs this much more than the last. */
const POINTS_PER_LEVEL_BEYOND_TABLE = 2000;

export type LevelInfo = {
  level: number;
  /** Points at which the current level began. */
  levelStartedAt: number;
  /** Points at which the next level begins. */
  nextLevelAt: number;
  /** 0-100, how far through the current level. */
  progressPercent: number;
  pointsToNextLevel: number;
};

export function levelFromPoints(totalPoints: number): LevelInfo {
  const points = Math.max(0, Math.floor(totalPoints || 0));

  let level = 1;
  let levelStartedAt = 0;
  let nextLevelAt = LEVEL_THRESHOLDS[1];

  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      levelStartedAt = LEVEL_THRESHOLDS[i];
      nextLevelAt =
        LEVEL_THRESHOLDS[i + 1] ?? LEVEL_THRESHOLDS[i] + POINTS_PER_LEVEL_BEYOND_TABLE;
    } else {
      nextLevelAt = LEVEL_THRESHOLDS[i];
      break;
    }
  }

  // Past the table the curve continues at a fixed cost per level.
  const tableTop = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (points >= tableTop) {
    const beyond = Math.floor((points - tableTop) / POINTS_PER_LEVEL_BEYOND_TABLE);
    level = LEVEL_THRESHOLDS.length + beyond;
    levelStartedAt = tableTop + beyond * POINTS_PER_LEVEL_BEYOND_TABLE;
    nextLevelAt = levelStartedAt + POINTS_PER_LEVEL_BEYOND_TABLE;
  }

  const span = nextLevelAt - levelStartedAt;
  const into = points - levelStartedAt;

  return {
    level,
    levelStartedAt,
    nextLevelAt,
    progressPercent: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 0,
    pointsToNextLevel: Math.max(0, nextLevelAt - points),
  };
}

/**
 * Calendar day in Asia/Tokyo. Streaks have to be measured in the member's
 * day, not UTC, or a 21:00 JST session counts as tomorrow.
 */
export function tokyoDateString(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return Number.NaN;
  return Math.round((to - from) / 86_400_000);
}

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  /** True when this activity started a new day of the streak. */
  advanced: boolean;
};

export function nextStreak(
  lastActivityDate: string | null | undefined,
  currentStreak: number,
  longestStreak: number,
  today: string
): StreakState {
  const current = Math.max(0, currentStreak || 0);
  const longest = Math.max(0, longestStreak || 0);

  // Stored values have been full ISO timestamps in the past; take the date.
  const last = lastActivityDate ? lastActivityDate.slice(0, 10) : null;

  if (!last) {
    return { currentStreak: 1, longestStreak: Math.max(1, longest), advanced: true };
  }

  const gap = daysBetween(last, today);

  if (Number.isNaN(gap) || gap < 0) {
    // Unparseable or a clock that moved backwards: leave the streak alone
    // rather than punishing the member for it.
    return { currentStreak: current, longestStreak: longest, advanced: false };
  }
  if (gap === 0) {
    return { currentStreak: current || 1, longestStreak: Math.max(longest, current || 1), advanced: false };
  }
  if (gap === 1) {
    const next = current + 1;
    return { currentStreak: next, longestStreak: Math.max(longest, next), advanced: true };
  }
  return { currentStreak: 1, longestStreak: Math.max(longest, 1), advanced: true };
}

export function reachedStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

/**
 * A streak survives the day after its last activity — that day is the one the
 * member still has to keep it going. It only breaks once a full day has been
 * skipped, so studying yesterday and not yet today still reads as a live
 * streak rather than zero.
 */
export function isStreakAlive(
  lastActivityDate: string | null | undefined,
  today: string
): boolean {
  if (!lastActivityDate) return false;
  const gap = daysBetween(lastActivityDate.slice(0, 10), today);
  if (Number.isNaN(gap)) return false;
  return gap >= 0 && gap <= 1;
}

// ------------------------------------------------------------------ badges

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const BADGES: BadgeDefinition[] = [
  { id: 'first-lesson', name: '最初の一歩', description: '初めてレッスンを完了した', icon: '🌱' },
  { id: 'lessons-10', name: '学習習慣', description: 'レッスンを10個完了した', icon: '📘' },
  { id: 'lessons-50', name: '継続の人', description: 'レッスンを50個完了した', icon: '📚' },
  { id: 'lessons-100', name: '百戦錬磨', description: 'レッスンを100個完了した', icon: '🏛️' },
  { id: 'first-course', name: '初完走', description: '講座を1つ完走した', icon: '🎯' },
  { id: 'courses-5', name: '講座マスター', description: '講座を5つ完走した', icon: '👑' },
  { id: 'streak-3', name: '三日坊主を超えた', description: '3日連続で学習した', icon: '🔥' },
  { id: 'streak-7', name: '一週間継続', description: '7日連続で学習した', icon: '⚡' },
  { id: 'streak-30', name: '一ヶ月継続', description: '30日連続で学習した', icon: '💎' },
  { id: 'streak-100', name: '百日行', description: '100日連続で学習した', icon: '🗻' },
];

export const BADGES_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

export type BadgeStats = {
  completedLessons: number;
  completedCourses: number;
  currentStreak: number;
};

/** Every badge the stats qualify for, earned or not. Caller filters. */
export function qualifyingBadgeIds(stats: BadgeStats): string[] {
  const earned: string[] = [];

  if (stats.completedLessons >= 1) earned.push('first-lesson');
  if (stats.completedLessons >= 10) earned.push('lessons-10');
  if (stats.completedLessons >= 50) earned.push('lessons-50');
  if (stats.completedLessons >= 100) earned.push('lessons-100');

  if (stats.completedCourses >= 1) earned.push('first-course');
  if (stats.completedCourses >= 5) earned.push('courses-5');

  if (stats.currentStreak >= 3) earned.push('streak-3');
  if (stats.currentStreak >= 7) earned.push('streak-7');
  if (stats.currentStreak >= 30) earned.push('streak-30');
  if (stats.currentStreak >= 100) earned.push('streak-100');

  return earned;
}
