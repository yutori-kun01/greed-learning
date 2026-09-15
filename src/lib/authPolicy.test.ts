import { describe, it, expect, afterEach, vi } from 'vitest'
import { isEmailVerificationRequired } from './authPolicy'

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
