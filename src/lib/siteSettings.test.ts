import { describe, it, expect } from 'vitest'
import {
  accentTextForLightTheme,
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

describe('accentTextForLightTheme', () => {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5]
      .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }
  const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05)

  it('darkens the brand gold until it is readable on a white panel', () => {
    expect(contrastOnWhite('#d9b45b')).toBeLessThan(4.5) // the starting point
    expect(contrastOnWhite(accentTextForLightTheme('#d9b45b'))).toBeGreaterThanOrEqual(4.5)
  })

  it('darkens every accent the admin can pick', () => {
    for (const color of ACCENT_COLORS) {
      expect(contrastOnWhite(accentTextForLightTheme(color.value))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('leaves a colour that is already dark enough alone', () => {
    expect(accentTextForLightTheme('#3b2a06')).toBe('#3b2a06')
  })

  it('returns a valid hex colour', () => {
    expect(accentTextForLightTheme('#4ade80')).toMatch(/^#[0-9a-f]{6}$/)
  })
})
