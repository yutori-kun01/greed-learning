import 'server-only';

import { getDb } from '@/db';
import { lessonProgress, lessons, pointEvents, user, userBadges } from '@/db/schema';
import { and, eq, inArray, desc, isNull, ne, or, sql } from 'drizzle-orm';
import { loadCompletedCourseIds } from '@/lib/journeyState';
import { getSiteSettingsQuery } from '@/lib/queries';
import {
  BADGES_BY_ID,
  isStreakAlive,
  levelFromPoints,
  nextStreak,
  qualifyingBadgeIds,
  reachedStreakMilestone,
  resolvePointValues,
  tokyoDateString,
  type LevelInfo,
  type PointValues,
} from '@/lib/points';

const db = () => getDb(process.env.DB as unknown as D1Database);

/** Points per action as currently configured (see resolvePointValues). */
export async function getPointValues(): Promise<PointValues> {
  return resolvePointValues(await getSiteSettingsQuery());
}

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
  return (await loadCompletedCourseIds(userId)).size;
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

  const values = await getPointValues();
  const candidates: Array<{ type: 'LESSON_COMPLETE' | 'COURSE_COMPLETE' | 'STREAK_BONUS'; points: number }> = [
    { type: 'LESSON_COMPLETE', points: values.LESSON_COMPLETE },
  ];

  const courseCompleted = await isCourseComplete(userId, courseId);
  if (courseCompleted) {
    candidates.push({ type: 'COURSE_COMPLETE', points: values.COURSE_COMPLETE });
  }
  if (streak.advanced && reachedStreakMilestone(streak.currentStreak)) {
    candidates.push({ type: 'STREAK_BONUS', points: values.STREAK_MILESTONE });
  }
  // An award the admin set to 0 is off: no ledger row for nothing.
  const events = candidates.filter((e) => e.points > 0);

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
      // Increment rather than write the total read above: the daily login
      // bonus can land between that read and this write.
      totalPoints: sql`${user.totalPoints} + ${pointsAwarded}`,
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
  /** Whether today's (Tokyo) login bonus has been paid. */
  loginBonusToday: boolean;
};

/**
 * Pays the daily login bonus if it has not been paid yet today (Tokyo day).
 * Returns the points awarded, or 0. The claim is a single conditional
 * UPDATE, so parallel requests on the same morning cannot both pay.
 */
export async function grantDailyLoginBonus(userId: string): Promise<number> {
  const today = tokyoDateString();
  const points = (await getPointValues()).DAILY_LOGIN;
  if (points <= 0) return 0;

  const claimed = await db()
    .update(user)
    .set({
      lastLoginBonusDate: today,
      totalPoints: sql`${user.totalPoints} + ${points}`,
    })
    .where(
      and(
        eq(user.id, userId),
        or(isNull(user.lastLoginBonusDate), ne(user.lastLoginBonusDate, today))
      )
    )
    .returning({ id: user.id });
  if (claimed.length === 0) return 0;

  await db().insert(pointEvents).values({
    id: crypto.randomUUID(),
    userId,
    type: 'DAILY_LOGIN',
    points,
    courseId: null,
    lessonId: null,
    createdAt: new Date().toISOString(),
  });
  return points;
}

export async function getGamificationSummary(userId: string): Promise<GamificationSummary> {
  const rows = await db()
    .select({
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      lastLoginBonusDate: user.lastLoginBonusDate,
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
    loginBonusToday: me?.lastLoginBonusDate === tokyoDateString(),
  };
}
