import 'server-only';

import { getDb } from '@/db';
import { lessonProgress, lessons, pointEvents, user, userBadges } from '@/db/schema';
import { and, eq, inArray, desc } from 'drizzle-orm';
import {
  BADGES_BY_ID,
  POINTS,
  isStreakAlive,
  levelFromPoints,
  nextStreak,
  qualifyingBadgeIds,
  reachedStreakMilestone,
  tokyoDateString,
  type LevelInfo,
} from '@/lib/points';

const db = () => getDb(process.env.DB as unknown as D1Database);

export type EarnedBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
};

export type Reward = {
  pointsAwarded: number;
  totalPoints: number;
  level: LevelInfo;
  leveledUp: boolean;
  currentStreak: number;
  streakAdvanced: boolean;
  courseCompleted: boolean;
  newBadges: EarnedBadge[];
};

/** How many distinct courses the member has finished every lesson of. */
async function countCompletedCourses(userId: string): Promise<number> {
  const rows = await db()
    .select({ courseId: lessons.courseId, lessonId: lessons.id, isCompleted: lessonProgress.isCompleted })
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

  let completed = 0;
  for (const { total, done } of totals.values()) {
    if (total > 0 && total === done) completed += 1;
  }
  return completed;
}

async function isCourseComplete(userId: string, courseId: string): Promise<boolean> {
  const courseLessons = await db()
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));
  if (courseLessons.length === 0) return false;

  const ids = courseLessons.map((l: { id: string }) => l.id);
  const done = await db()
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.isCompleted, true),
        inArray(lessonProgress.lessonId, ids)
      )
    );

  return done.length === ids.length;
}

async function countCompletedLessons(userId: string): Promise<number> {
  const rows = await db()
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.isCompleted, true)));
  return rows.length;
}

async function awardBadges(
  userId: string,
  stats: { completedLessons: number; completedCourses: number; currentStreak: number }
): Promise<EarnedBadge[]> {
  const qualifying = qualifyingBadgeIds(stats);
  if (qualifying.length === 0) return [];

  const existing = await db()
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const held = new Set(existing.map((b: { badgeId: string }) => b.badgeId));

  const toAward = qualifying.filter((id) => !held.has(id));
  if (toAward.length === 0) return [];

  const earnedAt = new Date().toISOString();
  const awarded: EarnedBadge[] = [];

  for (const badgeId of toAward) {
    const definition = BADGES_BY_ID.get(badgeId);
    if (!definition) continue;
    try {
      await db().insert(userBadges).values({
        id: crypto.randomUUID(),
        userId,
        badgeId,
        earnedAt,
      });
      awarded.push({ ...definition, earnedAt });
    } catch {
      // Unique index: a concurrent request already granted it.
    }
  }

  return awarded;
}

/**
 * Called once per lesson the first time it is completed. Never call it for a
 * re-completion, or unchecking and rechecking a lesson becomes a point farm.
 */
export async function recordLessonCompletion(
  userId: string,
  courseId: string
): Promise<Reward | null> {
  const rows = await db()
    .select({
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const me = rows[0];
  if (!me) return null;

  const today = tokyoDateString();
  const streak = nextStreak(me.lastActivityDate, me.currentStreak, me.longestStreak, today);

  const events: Array<{ type: 'LESSON_COMPLETE' | 'COURSE_COMPLETE' | 'STREAK_BONUS'; points: number }> = [
    { type: 'LESSON_COMPLETE', points: POINTS.LESSON_COMPLETE },
  ];

  const courseCompleted = await isCourseComplete(userId, courseId);
  if (courseCompleted) {
    events.push({ type: 'COURSE_COMPLETE', points: POINTS.COURSE_COMPLETE });
  }
  if (streak.advanced && reachedStreakMilestone(streak.currentStreak)) {
    events.push({ type: 'STREAK_BONUS', points: POINTS.STREAK_MILESTONE });
  }

  const pointsAwarded = events.reduce((sum, e) => sum + e.points, 0);
  const previousTotal = me.totalPoints ?? 0;
  const totalPoints = previousTotal + pointsAwarded;

  const createdAt = new Date().toISOString();
  for (const event of events) {
    await db().insert(pointEvents).values({
      id: crypto.randomUUID(),
      userId,
      type: event.type,
      points: event.points,
      courseId,
      lessonId: null,
      createdAt,
    });
  }

  await db()
    .update(user)
    .set({
      totalPoints,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: today,
    })
    .where(eq(user.id, userId));

  const newBadges = await awardBadges(userId, {
    completedLessons: await countCompletedLessons(userId),
    completedCourses: await countCompletedCourses(userId),
    currentStreak: streak.currentStreak,
  });

  const previousLevel = levelFromPoints(previousTotal);
  const level = levelFromPoints(totalPoints);

  return {
    pointsAwarded,
    totalPoints,
    level,
    leveledUp: level.level > previousLevel.level,
    currentStreak: streak.currentStreak,
    streakAdvanced: streak.advanced,
    courseCompleted,
    newBadges,
  };
}

export type GamificationSummary = {
  totalPoints: number;
  level: LevelInfo;
  currentStreak: number;
  longestStreak: number;
  completedLessons: number;
  completedCourses: number;
  badges: EarnedBadge[];
  recentEvents: Array<{ type: string; points: number; createdAt: string }>;
};

export async function getGamificationSummary(userId: string): Promise<GamificationSummary> {
  const rows = await db()
    .select({
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const me = rows[0];

  const totalPoints = me?.totalPoints ?? 0;

  // The stored streak keeps its last written value forever, so a streak
  // abandoned weeks ago would still display. Show it only while it is live.
  const stillActive = isStreakAlive(me?.lastActivityDate, tokyoDateString());

  const badgeRows = await db()
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  const badges: EarnedBadge[] = badgeRows
    .map((row: { badgeId: string; earnedAt: string }) => {
      const definition = BADGES_BY_ID.get(row.badgeId);
      return definition ? { ...definition, earnedAt: row.earnedAt } : null;
    })
    .filter((b: EarnedBadge | null): b is EarnedBadge => b !== null);

  const recentEvents = await db()
    .select({ type: pointEvents.type, points: pointEvents.points, createdAt: pointEvents.createdAt })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))
    .orderBy(desc(pointEvents.createdAt))
    .limit(10);

  return {
    totalPoints,
    level: levelFromPoints(totalPoints),
    currentStreak: stillActive ? (me?.currentStreak ?? 0) : 0,
    longestStreak: me?.longestStreak ?? 0,
    completedLessons: await countCompletedLessons(userId),
    completedCourses: await countCompletedCourses(userId),
    badges,
    recentEvents,
  };
}
