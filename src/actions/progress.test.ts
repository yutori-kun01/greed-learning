import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleLessonComplete } from './progress'
import { getDb } from '@/db'
import { getAuth } from '@/lib/auth'
import { recordLessonCompletion } from '@/lib/gamification'
import { canOpenCourse, diffUnlocks } from '@/lib/journeyState'

vi.mock('@/lib/gamification', () => ({
  recordLessonCompletion: vi.fn(),
}))

vi.mock('@/lib/journeyState', () => ({
  canOpenCourse: vi.fn(),
  getCourseJourneys: vi.fn().mockResolvedValue(new Map()),
  buildCourseJourneys: vi.fn().mockResolvedValue(new Map()),
  buildMemberRewards: vi.fn().mockResolvedValue([]),
  diffUnlocks: vi.fn(),
}))

// A drizzle-shaped chain that resolves to `result` however the query ends.
function chain(result: unknown) {
  const builder: any = {
    from: () => builder,
    where: () => builder,
    limit: () => builder,
    set: () => builder,
    values: () => builder,
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  return builder
}

// Selects run in a fixed order: the lesson, its course, then existing progress.
function mockDb(...selects: unknown[]) {
  const select = vi.fn()
  for (const result of selects) select.mockReturnValueOnce(chain(result))
  select.mockReturnValue(chain([]))
  const insert = vi.fn(() => chain(undefined))
  const update = vi.fn(() => chain(undefined))
  vi.mocked(getDb).mockReturnValue({ select, insert, update } as any)
  return { select, insert, update }
}

const lesson = { id: 'lesson-1', courseId: 'course-1' }
const course = { id: 'course-1', requiredPlanId: null }
const reward = { pointsAwarded: 10 } as any

beforeEach(() => {
  vi.mocked(getDb).mockReset()
  vi.mocked(canOpenCourse).mockReset().mockResolvedValue(true)
  vi.mocked(recordLessonCompletion).mockReset().mockResolvedValue(reward)
  vi.mocked(diffUnlocks).mockReset().mockReturnValue({ courses: [{ id: 'course-2', title: '応用' }], rewards: [] })
})

describe('Progress Actions', () => {
  it('should throw an error if unauthenticated', async () => {
    vi.mocked(getAuth).mockReturnValueOnce({
      api: { getSession: vi.fn().mockResolvedValue(null) }
    } as any)

    await expect(toggleLessonComplete('lesson-1', true)).rejects.toThrow('Unauthorized')
  })

  it('rejects a lesson that does not exist', async () => {
    mockDb([])
    await expect(toggleLessonComplete('nope', true)).rejects.toThrow('レッスンが見つかりません')
  })

  // A course still locked by the journey (or the plan) must not be
  // progressable by posting its lesson id directly.
  it('refuses a lesson in a course the member cannot open', async () => {
    const { insert, update } = mockDb([lesson], [course])
    vi.mocked(canOpenCourse).mockResolvedValue(false)

    await expect(toggleLessonComplete('lesson-1', true)).rejects.toThrow('この講座にはアクセスできません')
    expect(insert).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(recordLessonCompletion).not.toHaveBeenCalled()
  })

  it('awards points on the first completion and reports what it unlocked', async () => {
    const { insert } = mockDb([lesson], [course], [])
    const result = await toggleLessonComplete('lesson-1', true)

    expect(result).toMatchObject({ success: true, isCompleted: true, reward })
    expect(result.unlocked).toEqual({ courses: [{ id: 'course-2', title: '応用' }], rewards: [] })
    expect(insert).toHaveBeenCalledTimes(1)
    expect(recordLessonCompletion).toHaveBeenCalledWith('user-1', 'course-1')
  })

  it('awards nothing when re-completing a lesson', async () => {
    mockDb([lesson], [course], [{ id: 'p1', isCompleted: true }])
    const result = await toggleLessonComplete('lesson-1', true)

    expect(result).toMatchObject({ success: true, reward: null, unlocked: null })
    expect(recordLessonCompletion).not.toHaveBeenCalled()
  })

  it('should mark a lesson as incomplete', async () => {
    const { update } = mockDb([lesson], [course], [{ id: 'p1', isCompleted: true }])
    const result = await toggleLessonComplete('lesson-1', false)

    expect(result).toMatchObject({ success: true, isCompleted: false, reward: null })
    expect(update).toHaveBeenCalledTimes(1)
  })
})
