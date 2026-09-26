import { describe, it, expect } from 'vitest'
import { isCourseVisible } from './access'

describe('isCourseVisible', () => {
  it('shows published courses to members', () => {
    expect(isCourseVisible({ status: 'PUBLISHED' }, 'MEMBER')).toBe(true)
    expect(isCourseVisible({ status: 'PUBLISHED' }, undefined)).toBe(true)
  })

  it('hides drafts and archived courses from members', () => {
    expect(isCourseVisible({ status: 'DRAFT' }, 'MEMBER')).toBe(false)
    expect(isCourseVisible({ status: 'ARCHIVED' }, 'MEMBER')).toBe(false)
    expect(isCourseVisible({ status: 'DRAFT' }, undefined)).toBe(false)
    expect(isCourseVisible({ status: 'DRAFT' }, null)).toBe(false)
  })

  it('lets admins preview unpublished courses', () => {
    expect(isCourseVisible({ status: 'DRAFT' }, 'ADMIN')).toBe(true)
    expect(isCourseVisible({ status: 'ARCHIVED' }, 'ADMIN')).toBe(true)
  })
})

// --- 受講資格（サブスク必須の切替） -----------------------------------------

import { canAccessCourse, getAccessibleCourseIds } from './access'
import { getDb } from '@/db'
import { getSiteSettings } from '@/lib/siteSettings'
import { enrollments, user } from '@/db/schema'
import { vi, beforeEach } from 'vitest'

vi.mock('@/lib/siteSettings', () => ({ getSiteSettings: vi.fn() }))

type Rows = Record<string, unknown>[]

function fakeDb(tables: { user: Rows; enrollments: Rows }) {
  return {
    select: () => {
      let rows: Rows = []
      const builder: Record<string, unknown> = {
        from(table: unknown) {
          if (table === user) rows = tables.user
          else if (table === enrollments) rows = tables.enrollments
          return builder
        },
        where() {
          return builder
        },
        limit() {
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

const member = (extra: Record<string, unknown> = {}) => ({
  id: 'u1',
  subscriptionStatus: 'NONE',
  planId: null,
  ...extra,
})

const setup = (opts: {
  requireSubscription: boolean
  user?: Record<string, unknown>
  enrollments?: Rows
}) => {
  vi.mocked(getSiteSettings).mockResolvedValue({
    requireSubscription: opts.requireSubscription,
  } as never)
  vi.mocked(getDb).mockReturnValue(
    fakeDb({ user: [opts.user ?? member()], enrollments: opts.enrollments ?? [] }) as never
  )
}

beforeEach(() => {
  vi.mocked(getDb).mockReset()
  vi.mocked(getSiteSettings).mockReset()
})

const d1 = {} as D1Database
const openCourse = { id: 'c1', requiredPlanId: null }
const gatedCourse = { id: 'c2', requiredPlanId: 'plan-pro' }

describe('canAccessCourse', () => {
  it('opens ungated courses to any member when a subscription is not required', async () => {
    setup({ requireSubscription: false })
    expect(await canAccessCourse(d1, 'u1', openCourse)).toBe(true)
  })

  it('requires an active subscription for ungated courses once the setting is on', async () => {
    setup({ requireSubscription: true })
    expect(await canAccessCourse(d1, 'u1', openCourse)).toBe(false)

    setup({ requireSubscription: true, user: member({ subscriptionStatus: 'ACTIVE' }) })
    expect(await canAccessCourse(d1, 'u1', openCourse)).toBe(true)
  })

  it('still honours an individual grant when a subscription is required', async () => {
    setup({ requireSubscription: true, enrollments: [{ userId: 'u1', courseId: 'c1' }] })
    expect(await canAccessCourse(d1, 'u1', openCourse)).toBe(true)
  })

  it('gates plan-restricted courses to that plan regardless of the setting', async () => {
    setup({ requireSubscription: false, user: member({ subscriptionStatus: 'ACTIVE', planId: 'plan-basic' }) })
    expect(await canAccessCourse(d1, 'u1', gatedCourse)).toBe(false)

    setup({ requireSubscription: false, user: member({ subscriptionStatus: 'ACTIVE', planId: 'plan-pro' }) })
    expect(await canAccessCourse(d1, 'u1', gatedCourse)).toBe(true)
  })
})

describe('getAccessibleCourseIds', () => {
  it('matches canAccessCourse for the mixed catalogue', async () => {
    setup({ requireSubscription: false })
    expect([...(await getAccessibleCourseIds(d1, 'u1', [openCourse, gatedCourse]))]).toEqual(['c1'])

    setup({ requireSubscription: true })
    expect([...(await getAccessibleCourseIds(d1, 'u1', [openCourse, gatedCourse]))]).toEqual([])

    setup({ requireSubscription: true, user: member({ subscriptionStatus: 'ACTIVE', planId: 'plan-pro' }) })
    expect([...(await getAccessibleCourseIds(d1, 'u1', [openCourse, gatedCourse]))].sort()).toEqual(['c1', 'c2'])
  })

  it('includes courses unlocked by an individual grant', async () => {
    setup({ requireSubscription: true, enrollments: [{ userId: 'u1', courseId: 'c2' }] })
    expect([...(await getAccessibleCourseIds(d1, 'u1', [openCourse, gatedCourse]))]).toContain('c2')
  })
})
