/**
 * Upload constraints shared by the presigned-URL route and the client uploader.
 * Free of server-only imports so it is safe to bundle for the browser.
 */

/**
 * SVG is deliberately excluded: the bucket is served from a public domain, and
 * an SVG can carry script that would then run on that origin.
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function isAllowedImageType(contentType: string | null | undefined): boolean {
  return !!contentType && contentType in ALLOWED_IMAGE_TYPES;
}

export function extensionForImageType(contentType: string): string {
  return ALLOWED_IMAGE_TYPES[contentType] ?? 'bin';
}

export const MAX_IMAGE_LABEL = `${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB`;
export const ALLOWED_IMAGE_ACCEPT = Object.keys(ALLOWED_IMAGE_TYPES).join(',');

/**
 * Image URLs are rendered back into `<img src>`, so only http(s) URLs are
 * stored — this keeps `javascript:` and `data:` values out of the DB. Empty
 * input clears the field.
 */
export function sanitizeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}
