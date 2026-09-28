import { NextResponse } from 'next/server';
import { requireAdmin, requireUser } from '@/lib/session';
import { buildObjectKey, getBucket, mediaUrl } from '@/lib/storage';
import { sniffImage } from '@/lib/imageSniff';

/**
 * Receives one file as the raw request body and writes it to R2 through the
 * Worker's bucket binding.
 *
 *   POST /api/upload?purpose=<purpose>&filename=<name>
 *   Content-Type: <file type>
 *   <file bytes>
 *
 * Images are identified by their bytes, not the declared type, and stored
 * under that type, so nothing but a real JPEG/PNG/GIF/WebP is ever served
 * from /media. Perk files go under resources/, which /media does not serve.
 */

// Perks are documents and archives. Deliberately excludes text/html and
// javascript: anything a browser would render as a page.
const RESOURCE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'application/json': 'json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'video/mp4': 'mp4',
};

const MB = 1024 * 1024;

const PURPOSES = {
  // Images inside post and lesson bodies.
  image: { kind: 'image', maxBytes: 8 * MB, prefix: 'editor', adminOnly: true },
  // Course, lesson and post thumbnails, and the site logo.
  thumbnail: { kind: 'image', maxBytes: 8 * MB, prefix: 'thumbs', adminOnly: true },
  // A member's own profile picture: the one upload open to non-admins.
  avatar: { kind: 'image', maxBytes: 2 * MB, prefix: 'avatars', adminOnly: false },
  // Course perks. Workers accept request bodies up to 100MB on the free plan.
  resource: { kind: 'file', maxBytes: 95 * MB, prefix: 'resources', adminOnly: true },
} as const;

type Purpose = keyof typeof PURPOSES;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const purposeParam = url.searchParams.get('purpose') ?? 'image';
  // hasOwn, not `in`: "toString" would otherwise resolve through the prototype.
  if (!Object.hasOwn(PURPOSES, purposeParam)) return fail('不明なアップロード種別です');
  const purpose = PURPOSES[purposeParam as Purpose];

  let uploaderId: string;
  try {
    uploaderId = (purpose.adminOnly ? await requireAdmin() : await requireUser()).id;
  } catch {
    return fail('Unauthorized', 401);
  }

  const size = Number(req.headers.get('content-length'));
  if (!Number.isInteger(size) || size <= 0) return fail('ファイルが空です');
  if (size > purpose.maxBytes) {
    return fail(`ファイルサイズは ${Math.floor(purpose.maxBytes / MB)}MB 以下にしてください`, 413);
  }
  if (!req.body) return fail('ファイルが空です');

  const bucket = getBucket();
  if (!bucket) return fail('ファイル保存先（R2）が利用できません', 500);

  const fileName = (url.searchParams.get('filename') ?? 'file').slice(0, 200);

  try {
    if (purpose.kind === 'image') {
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (bytes.byteLength > purpose.maxBytes) {
        return fail(`ファイルサイズは ${Math.floor(purpose.maxBytes / MB)}MB 以下にしてください`, 413);
      }
      const image = sniffImage(bytes);
      if (!image) return fail('JPEG・PNG・GIF・WebP の画像を選んでください');

      const key = buildObjectKey(purpose.prefix, uploaderId, image.ext);
      await bucket.put(key, bytes, {
        httpMetadata: { contentType: image.mime, cacheControl: 'public, max-age=31536000, immutable' },
      });
      return NextResponse.json({ url: mediaUrl(key), objectKey: key });
    }

    const declared = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const ext = RESOURCE_TYPES[declared];
    if (!ext) return fail(`この形式はアップロードできません（${declared || '不明'}）`);

    // Streamed rather than buffered: a perk can be close to the Worker's
    // memory limit. R2 needs the length up front, which FixedLengthStream
    // provides and also enforces.
    const { readable, writable } = new FixedLengthStream(size);
    const piping = req.body.pipeTo(writable);
    const key = buildObjectKey(purpose.prefix, uploaderId, ext);
    await bucket.put(key, readable, {
      httpMetadata: { contentType: declared },
      customMetadata: { fileName },
    });
    await piping;
    return NextResponse.json({ objectKey: key, fileName, fileSize: size });
  } catch (error) {
    console.error('[upload] failed', error);
    return fail('アップロードに失敗しました', 500);
  }
}
