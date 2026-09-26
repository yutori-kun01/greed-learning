import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMemberProgress } from './progress'
import { getDb } from '@/db'
import { courses, lessonProgress, lessons } from '@/db/schema'

type Rows = Record<string, unknown>[]

/**
 * Minimal stand-in for the drizzle query builder: resolves to whichever fixture
 * matches the table passed to `.from()`.
 */
function fakeDb(tables: { courses: Rows; lessons: Rows; progress: Rows }) {
  return {
    select: () => {
      let rows: Rows = []
      const builder: Record<string, unknown> = {
        from(table: unknown) {
          if (table === courses) rows = tables.courses
          else if (table === lessons) rows = tables.lessons
          else if (table === lessonProgress) rows = tables.progress
          return builder
        },
        where() {
          return builder
        },
        then(resolve: (value: Rows) => unknown) {
          return resolve(rows)
        },
      }
      return builder
    },
  }
}

const course = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  number: id,
  title: `講座 ${id}`,
  description: null,
  badge: null,
  thumbnailUrl: null,
  status: 'PUBLISHED',
  ...extra,
})

const lesson = (id: string, courseId: string) => ({ id, courseId })

const done = (lessonId: string, completedAt: string | null) => ({
  lessonId,
  isCompleted: true,
  completedAt,
})

beforeEach(() => {
  vi.mocked(getDb).mockReset()
})

describe('getMemberProgress', () => {
  it('classifies courses by how many of their lessons are complete', async () => {
    vi.mocked(getDb).mockReturnValue(
      fakeDb({
        courses: [course('a'), course('b'), course('c')],
        lessons: [
          lesson('a1', 'a'),
          lesson('a2', 'a'),
          lesson('b1', 'b'),
          lesson('b2', 'b'),
          lesson('c1', 'c'),
        ],
        progress: [done('a1', '2026-09-10T00:00:00.000Z'), done('a2', '2026-09-11T00:00:00.000Z'), done('b1', '2026-09-12T00:00:00.000Z')],
      }) as never
    )

    const result = await getMemberProgress('user-1', new Date('2026-09-15T12:00:00.000Z'))

    expect(result.completedCourseCount).toBe(1) // a
    expect(result.inProgressCourseCount).toBe(1) // b
    expect(result.notStartedCourseCount).toBe(1) // c
    expect(result.completedLessonCount).toBe(3)
    expect(result.totalLessonCount).toBe(5)
    expect(result.overallPercent).toBe(60)
    expect(result.courses.find((c) => c.id === 'b')?.percent).toBe(50)
  })

  it('does not count a lesson that was un-completed', async () => {
    vi.mocked(getDb).mockReturnValue(
      fakeDb({
        courses: [course('a')],
        lessons: [lesson('a1', 'a'), lesson('a2', 'a')],
        progress: [
          done('a1', '2026-09-10T00:00:00.000Z'),
          { lessonId: 'a2', isCompleted: false, completedAt: null },
        ],
      }) as never
    )

    const result = await getMemberProgress('user-2', new Date('2026-09-15T12:00:00.000Z'))

    expect(result.completedLessonCount).toBe(1)
    expect(result.overallPercent).toBe(50)
    expect(result.courses[0].status).toBe('in_progress')
  })

  it('suggests the least-progressed started course, then unstarted ones', async () => {
    vi.mocked(getDb).mockReturnValue(
      fakeDb({
        courses: [course('a'), course('b'), course('c')],
        lessons: [
          lesson('a1', 'a'),
          lesson('a2', 'a'),
          lesson('b1', 'b'),
          lesson('b2', 'b'),
          lesson('b3', 'b'),
          lesson('b4', 'b'),
          lesson('c1', 'c'),
        ],
        progress: [done('a1', '2026-09-10T00:00:00.000Z'), done('b1', '2026-09-10T00:00:00.000Z')],
      }) as never
    )

    const result = await getMemberProgress('user-3', new Date('2026-09-15T12:00:00.000Z'))

    // a is at 50%, b at 25% → b is the one to nudge towards.
    expect(result.nextCourse?.id).toBe('b')
    expect(result.inProgress.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('buckets completions into the last four weeks and by month', async () => {
    vi.mocked(getDb).mockReturnValue(
      fakeDb({
        courses: [course('a')],
        lessons: [lesson('a1', 'a'), lesson('a2', 'a'), lesson('a3', 'a'), lesson('a4', 'a')],
        progress: [
          done('a1', '2026-09-15T09:00:00.000Z'), // this week
          done('a2', '2026-09-02T09:00:00.000Z'), // ~2 weeks ago, same month
          done('a3', '2026-08-20T09:00:00.000Z'), // last month, oldest week in the window
          done('a4', null), // completed, timestamp missing
        ],
      }) as never
    )

    const result = await getMemberProgress('user-4', new Date('2026-09-15T12:00:00.000Z'))

    expect(result.weeklyCompletions.map((w) => w.label)).toEqual(['W1', 'W2', 'W3', 'W4'])
    // The window is the 4 weeks ending today: W1 = 08-19〜08-26 … W4 = 09-09〜09-16.
    expect(result.weeklyCompletions.map((w) => w.count)).toEqual([1, 0, 1, 1])
    // The completion with no timestamp is counted in the totals but not bucketed.
    expect(result.completedThisMonth).toBe(2)
    expect(result.completedLastMonth).toBe(1)
  })

  it('returns empty progress instead of throwing when the DB is unavailable', async () => {
    vi.mocked(getDb).mockImplementation(() => {
      throw new Error('no such table: courses')
    })

    const result = await getMemberProgress('user-5', new Date('2026-09-15T12:00:00.000Z'))

    expect(result.totalCourseCount).toBe(0)
    expect(result.overallPercent).toBe(0)
    expect(result.nextCourse).toBeNull()
  })
})
