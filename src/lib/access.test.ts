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
