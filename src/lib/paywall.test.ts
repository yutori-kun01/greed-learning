import { describe, it, expect } from 'vitest';
import { splitAtPaywall } from './paywall';
import { sanitizeHtml } from './sanitize';

describe('splitAtPaywall', () => {
  it('splits on the marker the editor actually emits', () => {
    const { free, paid, hasMarker } = splitAtPaywall(
      '<p>preview</p><div data-type="paywall-line"></div><p>secret</p>'
    );
    expect(hasMarker).toBe(true);
    expect(free).toBe('<p>preview</p>');
    expect(paid).toBe('<p>secret</p>');
  });

  it('tolerates extra attributes and single quotes on the marker', () => {
    const { free, paid } = splitAtPaywall(
      `<p>preview</p><div class="x" data-type='paywall-line' id="y"></div><p>secret</p>`
    );
    expect(free).toBe('<p>preview</p>');
    expect(paid).toBe('<p>secret</p>');
  });

  it('tolerates a self-closed marker with no closing tag', () => {
    const { paid } = splitAtPaywall('<p>preview</p><div data-type="paywall-line"><p>secret</p>');
    expect(paid).toBe('<p>secret</p>');
  });

  // The failure this function exists to prevent: with no marker, the old code
  // returned the entire post as the free preview.
  it('withholds everything when the author placed no marker', () => {
    const { free, paid, hasMarker } = splitAtPaywall('<p>all of the paid content</p>');
    expect(hasMarker).toBe(false);
    expect(free).toBe('');
    expect(paid).toBe('<p>all of the paid content</p>');
  });

  it('handles empty and missing content', () => {
    expect(splitAtPaywall('')).toEqual({ free: '', paid: '', hasMarker: false });
    expect(splitAtPaywall(null)).toEqual({ free: '', paid: '', hasMarker: false });
  });

  // Content is sanitized on save, so the split has to work on sanitizer
  // output — not just on what the editor produced.
  it('still finds the marker after sanitization', () => {
    const stored = sanitizeHtml('<p>preview</p><div data-type="paywall-line"></div><p>secret</p>');
    const { free, paid, hasMarker } = splitAtPaywall(stored);
    expect(hasMarker).toBe(true);
    expect(free).toContain('preview');
    expect(paid).toContain('secret');
    expect(free).not.toContain('secret');
  });
});
