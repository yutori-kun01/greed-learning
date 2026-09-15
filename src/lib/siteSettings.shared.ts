/**
 * Site-settings constants and validators shared by server code and client
 * components. Kept free of DB imports so it is safe to bundle for the browser.
 */

export const DEFAULT_SITE_NAME = 'N8N MARKETING';

/**
 * Accent colours the admin can pick from. Values are literal CSS colours —
 * never `var(--gold)`, which would resolve to a self-reference once injected
 * as `--gold: var(--gold)` and make the whole custom property invalid.
 */
export const ACCENT_COLORS = [
  { name: 'Gold', value: '#d9b45b' },
  { name: 'Blue', value: '#6495ed' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Purple', value: '#c084fc' },
  { name: 'Red', value: '#f87171' },
  { name: 'Orange', value: '#fb923c' },
] as const;

export const BG_PATTERNS = [
  { id: 'pattern1', label: '標準 (Standard)' },
  { id: 'pattern2', label: 'ダークノイズ (Noise)' },
  { id: 'pattern3', label: 'グラデーション (Gradient)' },
  { id: 'pattern4', label: '幾何学模様 (Geometric)' },
  { id: 'pattern5', label: 'ウェーブ (Wave)' },
  { id: 'pattern6', label: 'メッシュ (Mesh)' },
] as const;

export const DEFAULT_BG_PATTERN = BG_PATTERNS[0].id;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * The accent colour is inlined into a `<style>` tag, so it must never carry
 * anything that could close the tag or smuggle in extra declarations. Only
 * plain hex colours pass; anything else (legacy `gold`, `var(--gold)`, an
 * injected payload) returns null and the stylesheet default stays in place.
 */
export function sanitizeAccentColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return HEX_COLOR.test(trimmed) ? trimmed : null;
}

/** Falls back to the standard pattern for unknown/legacy values. */
export function sanitizeBgPattern(value: string | null | undefined): string {
  return BG_PATTERNS.some((pattern) => pattern.id === value) ? (value as string) : DEFAULT_BG_PATTERN;
}
