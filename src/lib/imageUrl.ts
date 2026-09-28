/**
 * Normalizes an image URL submitted from a settings form.
 *
 * These URLs end up in <img src>, so only http(s) and this site's own
 * /media paths are accepted: a
 * `javascript:` or `data:` value typed or posted by hand would otherwise be
 * stored and rendered for every visitor. Blank means "no image".
 */
export function normalizeImageUrl(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  // Files uploaded to this site's own storage (see /media).
  if (/^\/media\/(editor|avatars|thumbs)\/[A-Za-z0-9._\/-]+$/.test(raw) && !raw.includes('..')) {
    return raw;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('画像URLの形式が正しくありません');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('画像URLは http(s):// で始まるものを指定してください');
  }
  return url.toString();
}
