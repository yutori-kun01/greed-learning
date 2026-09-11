/**
 * The editor's PaywallLine extension serializes to
 * `<div data-type="paywall-line"></div>`. Content before it is the free
 * preview; content after it is what the reader is paying for.
 *
 * The reader-side split previously looked for `<!-- PAYWALL -->`, a marker the
 * editor never produced. `String.split` on an absent separator returns the
 * whole string, so every paid post was served in full to people who had not
 * bought it, with a purchase prompt appended underneath.
 */
const PAYWALL_MARKER = /<div[^>]*\bdata-type\s*=\s*["']paywall-line["'][^>]*>\s*(?:<\/div>)?/i;

export type PaywallSplit = {
  /** Shown to everyone. */
  free: string;
  /** Shown only once access is granted. */
  paid: string;
  /** False when the author never placed a marker. */
  hasMarker: boolean;
};

export function splitAtPaywall(html: string | null | undefined): PaywallSplit {
  if (!html) return { free: '', paid: '', hasMarker: false };

  const match = PAYWALL_MARKER.exec(html);
  if (!match) {
    // No marker: treat the whole post as paid. Falling back to "all free"
    // would give the content away, which is the failure that motivated this.
    return { free: '', paid: html, hasMarker: false };
  }

  return {
    free: html.slice(0, match.index),
    paid: html.slice(match.index + match[0].length),
    hasMarker: true,
  };
}
