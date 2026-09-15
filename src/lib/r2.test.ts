import { describe, it, expect, afterEach } from 'vitest'
import { getR2Config, isR2Configured } from './r2'

const KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
] as const

function setAll(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) {
    const value = values[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

const COMPLETE = {
  R2_ACCOUNT_ID: 'acc',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET_NAME: 'bucket',
  R2_PUBLIC_URL: 'https://pub-x.r2.dev',
}

afterEach(() => setAll({}))

describe('getR2Config', () => {
  it('returns the config when every value is set', () => {
    setAll(COMPLETE)
    expect(getR2Config()).toEqual({
      accountId: 'acc',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      bucketName: 'bucket',
      publicUrl: 'https://pub-x.r2.dev',
    })
    expect(isR2Configured()).toBe(true)
  })

  it('strips a trailing slash so image URLs do not get a double slash', () => {
    setAll({ ...COMPLETE, R2_PUBLIC_URL: 'https://pub-x.r2.dev/' })
    expect(getR2Config()?.publicUrl).toBe('https://pub-x.r2.dev')
  })

  it('treats a partial configuration as unconfigured', () => {
    for (const missing of KEYS) {
      const values = { ...COMPLETE }
      delete (values as Record<string, string>)[missing]
      setAll(values)
      expect(isR2Configured(), `missing ${missing}`).toBe(false)
      expect(getR2Config()).toBeNull()
    }
  })
})
