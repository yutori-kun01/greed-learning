import 'server-only';

import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * File storage on R2 through the Worker's own bucket binding (R2_ASSETS in
 * wrangler.toml). The Worker already has access to its bucket, so no R2 API
 * token, S3 credentials or public bucket URL are needed: uploads are written
 * by the Worker and images are served back through /media.
 */

export function getBucket(): R2Bucket | null {
  try {
    return (getCloudflareContext().env as { R2_ASSETS?: R2Bucket }).R2_ASSETS ?? null;
  } catch {
    // `next dev` without the Cloudflare dev proxy has no bindings.
    return null;
  }
}

/**
 * Key prefixes that /media serves to anyone. Perk files (resources/) are
 * deliberately absent: they are only reachable through the access-checked
 * download route.
 */
export const PUBLIC_PREFIXES = ['editor/', 'avatars/', 'thumbs/'] as const;

export function isPublicKey(key: string): boolean {
  return (
    PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
    !key.includes('..') &&
    !key.includes('//')
  );
}

/** URL an uploaded public object is served from. */
export function mediaUrl(key: string): string {
  return `/media/${key}`;
}

export function buildObjectKey(prefix: string, ownerId: string, ext: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${prefix}/${ownerId}/${Date.now()}-${random}.${ext}`;
}
