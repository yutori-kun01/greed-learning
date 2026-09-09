import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AwsClient } from 'aws4fetch';

// Only these types get a signed URL, and the extension is derived from the
// type rather than the client-supplied filename. Without this an uploader
// could store text/html and serve arbitrary pages from the bucket's public
// origin.
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 300;

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const auth = getAuth(process.env.DB as unknown as D1Database);
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Uploading is an authoring action — only the editor (admin) needs it.
    if ((session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { filename, contentType, size } = body as {
      filename?: string;
      contentType?: string;
      size?: number;
    };

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported content type. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(size) || size! <= 0 || size! > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File size must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes` },
        { status: 400 }
      );
    }

    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
    const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.R2_BUCKET_NAME;

    if (!r2AccountId || !r2AccessKey || !r2SecretKey || !r2BucketName) {
      return NextResponse.json({ error: 'R2 configuration is missing' }, { status: 500 });
    }

    const aws = new AwsClient({
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretKey,
      service: 's3',
      region: 'auto',
    });

    // The base name is cosmetic; stripping everything but word characters
    // keeps dots and slashes out of the key entirely.
    const base =
      filename.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'image';
    const objectKey = `${session.user.id}/${Date.now()}-${base}.${ext}`;

    const endpoint = new URL(
      `https://${r2AccountId}.r2.cloudflarestorage.com/${r2BucketName}/${objectKey}`
    );
    endpoint.searchParams.set('X-Amz-Expires', String(SIGNED_URL_TTL_SECONDS));

    // Content-Type and Content-Length are part of the signature, so the
    // eventual PUT can only be the type and exact size approved above.
    const signedRequest = await aws.sign(endpoint.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(size),
      },
      aws: { signQuery: true },
    });

    return NextResponse.json({
      uploadUrl: signedRequest.url,
      objectKey,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${objectKey}`,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
