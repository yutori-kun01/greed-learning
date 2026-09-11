import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { getR2Config, signUpload } from '@/lib/r2';

/**
 * Mints a presigned PUT so the browser can upload straight to R2.
 *
 * Two purposes with different limits: images embedded in the editor, and
 * files distributed as course perks. Both are admin-only — this is an
 * authoring endpoint, and leaving it open to any signed-in member turned the
 * bucket into free storage and a way to serve arbitrary HTML from it.
 */

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Perks are documents and archives. Deliberately excludes text/html and
// javascript: anything served back to a browser as a page is a phishing and
// XSS vector, even from a signed URL.
const RESOURCE_TYPES: Record<string, string> = {
  ...IMAGE_TYPES,
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

const LIMITS = {
  image: { types: IMAGE_TYPES, maxBytes: 8 * 1024 * 1024, prefix: 'editor' },
  resource: { types: RESOURCE_TYPES, maxBytes: 200 * 1024 * 1024, prefix: 'resources' },
} as const;

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { filename, contentType, size, purpose } = body as {
      filename?: string;
      contentType?: string;
      size?: number;
      purpose?: 'image' | 'resource';
    };

    const limits = LIMITS[purpose === 'resource' ? 'resource' : 'image'];

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    const ext = limits.types[contentType];
    if (!ext) {
      return NextResponse.json(
        { error: `この形式はアップロードできません（${contentType}）` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(size) || size! <= 0 || size! > limits.maxBytes) {
      return NextResponse.json(
        { error: `ファイルサイズは ${Math.floor(limits.maxBytes / 1024 / 1024)}MB 以下にしてください` },
        { status: 400 }
      );
    }

    const config = getR2Config();
    if (!config) {
      return NextResponse.json(
        { error: 'R2が設定されていません（R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME）' },
        { status: 500 }
      );
    }

    // The base name is cosmetic; stripping everything but word characters
    // keeps dots and slashes out of the key entirely.
    const base =
      filename.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'file';
    const objectKey = `${limits.prefix}/${admin.id}/${Date.now()}-${base}.${ext}`;

    const uploadUrl = await signUpload(config, objectKey, contentType, size!);

    return NextResponse.json({
      uploadUrl,
      objectKey,
      // Only meaningful for editor images, which are served from the bucket's
      // public hostname. Perk files are fetched through the download route.
      publicUrl: process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/${objectKey}` : null,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
