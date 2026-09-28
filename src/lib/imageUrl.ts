/**
 * Normalizes an image URL submitted from a settings form.
 *
 * These URLs end up in <img src>, so only http(s) is accepted: a
 * `javascript:` or `data:` value typed or posted by hand would otherwise be
 * stored and rendered for every visitor. Blank means "no image".
 */
export function normalizeImageUrl(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

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
