import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendSupportInquiry } from './support'
import { getAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getSiteSettings } from '@/lib/siteSettings'

vi.mock('@/lib/email', async () => {
  const actual = await vi.importActual<typeof import('@/lib/email')>('@/lib/email')
  return { ...actual, sendEmail: vi.fn().mockResolvedValue({ sent: true }) }
})

vi.mock('@/lib/siteSettings', () => ({
  getSiteSettings: vi.fn().mockResolvedValue({ operatorEmail: 'operator@example.com' }),
}))

const form = (values: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

const VALID = { name: '山田 太郎', email: 'member@example.com', message: '視聴できません' }

beforeEach(() => {
  vi.mocked(sendEmail).mockClear().mockResolvedValue({ sent: true })
  vi.mocked(getSiteSettings).mockResolvedValue({ operatorEmail: 'operator@example.com' } as never)
})

describe('sendSupportInquiry', () => {
  it('sends the enquiry to the operator address with a reply-to', async () => {
    const result = await sendSupportInquiry(form(VALID))

    expect(result).toEqual({ ok: true })
    expect(sendEmail).toHaveBeenCalledOnce()
    const sent = vi.mocked(sendEmail).mock.calls[0][0]
    expect(sent.to).toBe('operator@example.com')
    expect(sent.replyTo).toBe('member@example.com')
    expect(sent.html).toContain('視聴できません')
  })

  it('escapes user input so the enquiry cannot inject markup', async () => {
    await sendSupportInquiry(form({ ...VALID, message: '<script>alert(1)</script>' }))
    const sent = vi.mocked(sendEmail).mock.calls[0][0]
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).toContain('&lt;script&gt;')
  })

  it('rejects incomplete input without sending anything', async () => {
    expect(await sendSupportInquiry(form({ ...VALID, name: '  ' }))).toMatchObject({ ok: false })
    expect(await sendSupportInquiry(form({ ...VALID, email: 'not-an-email' }))).toMatchObject({ ok: false })
    expect(await sendSupportInquiry(form({ ...VALID, message: '' }))).toMatchObject({ ok: false })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('requires a session', async () => {
    vi.mocked(getAuth).mockReturnValueOnce({
      api: { getSession: vi.fn().mockResolvedValue(null) },
    } as never)

    expect(await sendSupportInquiry(form(VALID))).toMatchObject({ ok: false })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('reports a failure instead of pretending the enquiry was sent', async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce({ sent: false, reason: 'not-configured' })
    const result = await sendSupportInquiry(form(VALID))
    expect(result).toMatchObject({ ok: false })
  })

  it('falls back to the sender address when no operator email is set', async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce(null as never)
    process.env.RESEND_FROM_EMAIL = 'no-reply@example.com'

    await sendSupportInquiry(form(VALID))
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toBe('no-reply@example.com')
    delete process.env.RESEND_FROM_EMAIL
  })
})
