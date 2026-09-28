import { describe, expect, it } from 'vitest';
import { normalizeImageUrl } from './imageUrl';

describe('normalizeImageUrl', () => {
  it('treats blank as no image', () => {
    expect(normalizeImageUrl(null)).toBeNull();
    expect(normalizeImageUrl('   ')).toBeNull();
  });

  it('accepts http(s) URLs', () => {
    expect(normalizeImageUrl(' https://cdn.example.com/a.png ')).toBe('https://cdn.example.com/a.png');
    expect(normalizeImageUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
  });

  it('rejects script and data URLs', () => {
    expect(() => normalizeImageUrl('javascript:alert(1)')).toThrow();
    expect(() => normalizeImageUrl('data:image/svg+xml,<svg onload=alert(1)>')).toThrow();
  });

  it('rejects things that are not URLs', () => {
    expect(() => normalizeImageUrl('not a url')).toThrow();
  });
});
