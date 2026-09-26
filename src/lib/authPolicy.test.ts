import { describe, it, expect, afterEach, vi } from 'vitest'
import { isEmailVerificationRequired, shouldPromoteToAdmin } from './authPolicy'

const reset = () => {
  delete process.env.REQUIRE_EMAIL_VERIFICATION
  delete process.env.RESEND_API_KEY
  delete process.env.RESEND_FROM_EMAIL
}

afterEach(() => {
  reset()
  vi.restoreAllMocks()
})

describe('isEmailVerificationRequired', () => {
  it('is off unless explicitly enabled', () => {
    expect(isEmailVerificationRequired()).toBe(false)
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false'
    expect(isEmailVerificationRequired()).toBe(false)
  })

  it('is on when enabled and transactional email is configured', () => {
    process.env.REQUIRE_EMAIL_VERIFICATION = 'true'
    process.env.RESEND_API_KEY = 'key'
    process.env.RESEND_FROM_EMAIL = 'no-reply@example.com'
    expect(isEmailVerificationRequired()).toBe(true)
  })

  it('refuses to lock users out when email is not configured', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.REQUIRE_EMAIL_VERIFICATION = 'true'
    // No RESEND_* — nobody could receive the confirmation link.
    expect(isEmailVerificationRequired()).toBe(false)
    expect(warn).toHaveBeenCalled()
  })
})

describe('shouldPromoteToAdmin', () => {
  const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

  it('promotes only the configured address, whenever it signs up', () => {
    process.env.ADMIN_EMAIL = 'owner@example.com'
    expect(shouldPromoteToAdmin('owner@example.com', 0)).toBe(true)
    expect(shouldPromoteToAdmin('owner@example.com', 42)).toBe(true)
    expect(shouldPromoteToAdmin('stranger@example.com', 0)).toBe(false)
    delete process.env.ADMIN_EMAIL
  })

  it('ignores case and surrounding whitespace on the configured address', () => {
    process.env.ADMIN_EMAIL = '  Owner@Example.com '
    expect(shouldPromoteToAdmin('owner@example.com', 0)).toBe(true)
    delete process.env.ADMIN_EMAIL
  })

  it('falls back to the first signup, with a warning, when unset', () => {
    const warn = quiet()
    expect(shouldPromoteToAdmin('first@example.com', 0)).toBe(true)
    expect(warn).toHaveBeenCalled()
    expect(shouldPromoteToAdmin('second@example.com', 1)).toBe(false)
  })
})
