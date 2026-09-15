import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AwsClient } from 'aws4fetch';
import {
  MAX_IMAGE_BYTES,
  extensionForImageType,
  isAllowedImageType,
} from '@/lib/uploads';

// Reusing global auth setup. Note: DB binding is only required if we fetch users,
// but for getSession we pass the dummy because we just need to verify session token.
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

    const body = await req.json();
    const { contentType, size } = body as { contentType: string; size?: number };

    if (!contentType) {
      return NextResponse.json({ error: 'Missing contentType' }, { status: 400 });
    }

    // The bucket is public, so only image types we are willing to serve back
    // are signed for. SVG is excluded — it can carry script.
    if (!isAllowedImageType(contentType)) {
      return NextResponse.json({ error: 'この形式のファイルはアップロードできません' }, { status: 415 });
    }

    if (typeof size === 'number' && size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます' }, { status: 413 });
    }

    // Configure aws4fetch
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

    // The object key is derived from the session and the validated content
    // type only — the client's filename never reaches the bucket.
    const objectKey = `${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${extensionForImageType(contentType)}`;

    const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2BucketName}/${objectKey}`;

    // Create Presigned PUT URL (valid for 15 minutes)
    const signedRequest = await aws.sign(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      aws: { signQuery: true },
    });

    return NextResponse.json({
      uploadUrl: signedRequest.url,
      objectKey,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${objectKey}`
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
