import { describe, expect, it } from 'vitest'
import { checkBinding, readBinding } from './check-d1-binding.mjs'

const toml = `
name = "app"

[[d1_databases]]
binding = "DB"
database_name = "greed-learning-db"
database_id = "aaaa-1111"
migrations_dir = "./src/db/migrations"

[[r2_buckets]]
binding = "R2_ASSETS"
bucket_name = "greed-learning-assets"
`

describe('readBinding', () => {
  it('reads the D1 name and id, not fields from other tables', () => {
    expect(readBinding(toml)).toEqual({ name: 'greed-learning-db', id: 'aaaa-1111' })
  })

  it('reports nothing when there is no D1 table', () => {
    expect(readBinding('name = "app"')).toEqual({ name: null, id: null })
  })
})

describe('checkBinding', () => {
  const binding = { name: 'greed-learning-db', id: 'aaaa-1111' }

  it('passes when the account has that database under that id', () => {
    expect(checkBinding([{ name: 'greed-learning-db', uuid: 'aaaa-1111' }], binding).ok).toBe(true)
  })

  it('fails with the right id when wrangler.toml points elsewhere', () => {
    const result = checkBinding([{ name: 'greed-learning-db', uuid: 'bbbb-2222' }], binding)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('bbbb-2222')
  })

  it('fails when the database does not exist', () => {
    const result = checkBinding([{ name: 'other', uuid: 'aaaa-1111' }], binding)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('wrangler d1 create')
  })
})
