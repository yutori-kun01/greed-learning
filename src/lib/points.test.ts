import { describe, it, expect } from 'vitest';
import {
  BADGES,
  POINTS,
  isStreakAlive,
  levelFromPoints,
  nextStreak,
  qualifyingBadgeIds,
  reachedStreakMilestone,
  tokyoDateString,
} from './points';

describe('levelFromPoints', () => {
  it('starts everyone at level 1', () => {
    const info = levelFromPoints(0);
    expect(info.level).toBe(1);
    expect(info.progressPercent).toBe(0);
    expect(info.pointsToNextLevel).toBe(50);
  });

  it('levels up exactly on the threshold', () => {
    expect(levelFromPoints(49).level).toBe(1);
    expect(levelFromPoints(50).level).toBe(2);
    expect(levelFromPoints(149).level).toBe(2);
    expect(levelFromPoints(150).level).toBe(3);
  });

  it('reports progress through the current level', () => {
    // Level 2 spans 50-150, so 100 points is halfway.
    const info = levelFromPoints(100);
    expect(info.level).toBe(2);
    expect(info.levelStartedAt).toBe(50);
    expect(info.nextLevelAt).toBe(150);
    expect(info.progressPercent).toBe(50);
    expect(info.pointsToNextLevel).toBe(50);
  });

  it('keeps levelling at a fixed cost beyond the table', () => {
    const top = levelFromPoints(10000);
    expect(top.level).toBe(15);
    expect(levelFromPoints(12000).level).toBe(16);
    expect(levelFromPoints(14000).level).toBe(17);
  });

  it('never goes below level 1 on junk input', () => {
    expect(levelFromPoints(-500).level).toBe(1);
    expect(levelFromPoints(NaN).level).toBe(1);
  });

  it('increases monotonically', () => {
    let previous = 0;
    for (let points = 0; points < 20000; points += 137) {
      const { level } = levelFromPoints(points);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});

describe('nextStreak', () => {
  it('starts a streak for a member with no history', () => {
    expect(nextStreak(null, 0, 0, '2026-09-11')).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      advanced: true,
    });
  });

  it('does not advance twice in one day', () => {
    const result = nextStreak('2026-09-11', 4, 9, '2026-09-11');
    expect(result.currentStreak).toBe(4);
    expect(result.advanced).toBe(false);
  });

  it('extends the streak the following day', () => {
    const result = nextStreak('2026-09-10', 4, 9, '2026-09-11');
    expect(result.currentStreak).toBe(5);
    expect(result.advanced).toBe(true);
  });

  it('resets after a missed day', () => {
    const result = nextStreak('2026-09-08', 12, 12, '2026-09-11');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(12);
    expect(result.advanced).toBe(true);
  });

  it('raises the longest streak when the current one passes it', () => {
    expect(nextStreak('2026-09-10', 9, 9, '2026-09-11').longestStreak).toBe(10);
  });

  it('handles a stored full ISO timestamp', () => {
    const result = nextStreak('2026-09-10T13:45:12.000Z', 2, 2, '2026-09-11');
    expect(result.currentStreak).toBe(3);
  });

  it('leaves the streak alone if the clock moved backwards', () => {
    const result = nextStreak('2026-09-12', 5, 7, '2026-09-11');
    expect(result).toEqual({ currentStreak: 5, longestStreak: 7, advanced: false });
  });

  it('crosses a month boundary', () => {
    expect(nextStreak('2026-08-31', 3, 3, '2026-09-01').currentStreak).toBe(4);
  });
});

describe('isStreakAlive', () => {
  it('counts today as alive', () => {
    expect(isStreakAlive('2026-09-11', '2026-09-11')).toBe(true);
  });

  // Studying yesterday and not yet today must not read as a broken streak.
  it('counts yesterday as still alive', () => {
    expect(isStreakAlive('2026-09-10', '2026-09-11')).toBe(true);
  });

  it('treats a skipped day as broken', () => {
    expect(isStreakAlive('2026-09-09', '2026-09-11')).toBe(false);
  });

  it('treats no history as no streak', () => {
    expect(isStreakAlive(null, '2026-09-11')).toBe(false);
  });
});

describe('tokyoDateString', () => {
  it('uses the Tokyo calendar day, not UTC', () => {
    // 2026-09-11T16:00:00Z is already 2026-09-12 in Tokyo (UTC+9).
    expect(tokyoDateString(new Date('2026-09-11T16:00:00Z'))).toBe('2026-09-12');
    expect(tokyoDateString(new Date('2026-09-11T14:59:00Z'))).toBe('2026-09-11');
  });
});

describe('reachedStreakMilestone', () => {
  it('fires only on the milestone days', () => {
    expect(reachedStreakMilestone(3)).toBe(true);
    expect(reachedStreakMilestone(7)).toBe(true);
    expect(reachedStreakMilestone(4)).toBe(false);
    expect(reachedStreakMilestone(8)).toBe(false);
  });
});

describe('qualifyingBadgeIds', () => {
  it('awards nothing to a member who has done nothing', () => {
    expect(qualifyingBadgeIds({ completedLessons: 0, completedCourses: 0, currentStreak: 0 })).toEqual([]);
  });

  it('awards the first lesson badge', () => {
    const ids = qualifyingBadgeIds({ completedLessons: 1, completedCourses: 0, currentStreak: 1 });
    expect(ids).toContain('first-lesson');
    expect(ids).not.toContain('lessons-10');
  });

  it('includes every lower tier once a higher one is reached', () => {
    const ids = qualifyingBadgeIds({ completedLessons: 100, completedCourses: 5, currentStreak: 30 });
    expect(ids).toEqual(
      expect.arrayContaining([
        'first-lesson', 'lessons-10', 'lessons-50', 'lessons-100',
        'first-course', 'courses-5',
        'streak-3', 'streak-7', 'streak-30',
      ])
    );
    expect(ids).not.toContain('streak-100');
  });

  it('only names badges that actually exist', () => {
    const known = new Set(BADGES.map((b) => b.id));
    const ids = qualifyingBadgeIds({ completedLessons: 999, completedCourses: 99, currentStreak: 999 });
    for (const id of ids) expect(known.has(id)).toBe(true);
  });
});

describe('POINTS', () => {
  it('values finishing a course well above a single lesson', () => {
    expect(POINTS.COURSE_COMPLETE).toBeGreaterThan(POINTS.LESSON_COMPLETE);
  });
});
