/**
 * Learning streak: consecutive days with at least one completed lesson.
 *
 * `lastActivityDate` was being written on every completion but the streak
 * itself was never computed, so the dashboard and the sidebar always showed 0.
 * Dates are compared in the site's timezone (Asia/Tokyo) so a lesson finished
 * at 23:50 JST counts for that day rather than the following UTC day.
 */
export const STREAK_TIME_ZONE = 'Asia/Tokyo';

/** YYYY-MM-DD in the site's timezone. */
export function localDateKey(date: Date, timeZone: string = STREAK_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / 86400000);
}

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
};

/**
 * Applies one activity at `now` to the stored streak.
 * Same day → unchanged. Next day → +1. A gap → restart at 1.
 */
export function advanceStreak(previous: StreakState, now: Date, timeZone: string = STREAK_TIME_ZONE): StreakState {
  const today = localDateKey(now, timeZone);
  const lastKey = previous.lastActivityDate ? previous.lastActivityDate.slice(0, 10) : null;

  let currentStreak: number;
  if (!lastKey) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(lastKey, today);
    if (gap === 0) currentStreak = Math.max(previous.currentStreak, 1);
    else if (gap === 1) currentStreak = previous.currentStreak + 1;
    else if (gap < 0) currentStreak = Math.max(previous.currentStreak, 1); // 時計のずれ等で過去日が残っている場合
    else currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    lastActivityDate: today,
  };
}

/**
 * The stored streak goes stale as soon as a day is missed, so reading code
 * must decay it rather than trusting the last written value.
 */
export function currentStreakAsOf(state: StreakState, now: Date, timeZone: string = STREAK_TIME_ZONE): number {
  if (!state.lastActivityDate) return 0;
  const gap = daysBetween(state.lastActivityDate.slice(0, 10), localDateKey(now, timeZone));
  return gap <= 1 ? state.currentStreak : 0;
}
