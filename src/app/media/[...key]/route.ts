import { getBucket, isPublicKey } from '@/lib/storage';

/**
 * Serves uploaded images (logo, avatars, thumbnails, editor images) from R2.
 *
 * Only the public prefixes are reachable; perk files are not. Keys are
 * unique per upload, so responses are cached for a year. The headers keep a
 * stored file from ever being treated as a page: the type is the one the
 * upload route verified, sniffing is off, and a CSP blocks any script.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.map(decodeURIComponent).join('/');
  if (!isPublicKey(key)) return new Response('Not found', { status: 404 });

  const bucket = getBucket();
  if (!bucket) return new Response('Storage unavailable', { status: 503 });

  const object = await bucket.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
