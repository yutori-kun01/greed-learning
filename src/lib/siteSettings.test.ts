import { describe, it, expect } from 'vitest'
import {
  ACCENT_COLORS,
  BG_PATTERNS,
  DEFAULT_BG_PATTERN,
  sanitizeAccentColor,
  sanitizeBgPattern,
} from './siteSettings.shared'

describe('sanitizeAccentColor', () => {
  it('accepts every colour offered in the admin picker', () => {
    for (const color of ACCENT_COLORS) {
      expect(sanitizeAccentColor(color.value)).toBe(color.value)
    }
  })

  it('accepts 3- and 6-digit hex, trimming whitespace', () => {
    expect(sanitizeAccentColor('#abc')).toBe('#abc')
    expect(sanitizeAccentColor('  #D9B45B  ')).toBe('#D9B45B')
  })

  it('rejects values that are not plain hex colours', () => {
    // `var(--gold)` would become `--gold: var(--gold)` — a self-reference that
    // invalidates the custom property. The legacy 'gold' default is dropped too.
    expect(sanitizeAccentColor('var(--gold)')).toBeNull()
    expect(sanitizeAccentColor('gold')).toBeNull()
    expect(sanitizeAccentColor('')).toBeNull()
    expect(sanitizeAccentColor(null)).toBeNull()
    expect(sanitizeAccentColor(undefined)).toBeNull()
  })

  it('rejects payloads that would break out of the inline <style> tag', () => {
    expect(sanitizeAccentColor('red; } body { display: none; }')).toBeNull()
    expect(sanitizeAccentColor('#fff</style><script>alert(1)</script>')).toBeNull()
  })
})

describe('sanitizeBgPattern', () => {
  it('accepts every pattern offered in the admin picker', () => {
    for (const pattern of BG_PATTERNS) {
      expect(sanitizeBgPattern(pattern.id)).toBe(pattern.id)
    }
  })

  it('falls back to the standard pattern for unknown or missing values', () => {
    expect(sanitizeBgPattern('pattern99')).toBe(DEFAULT_BG_PATTERN)
    expect(sanitizeBgPattern('')).toBe(DEFAULT_BG_PATTERN)
    expect(sanitizeBgPattern(null)).toBe(DEFAULT_BG_PATTERN)
    expect(sanitizeBgPattern(undefined)).toBe(DEFAULT_BG_PATTERN)
  })
})
