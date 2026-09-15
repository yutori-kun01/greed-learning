import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AwsClient } from 'aws4fetch';
import {
  MAX_IMAGE_BYTES,
  extensionForImageType,
  isAllowedImageType,
} from '@/lib/uploads';
import { getR2Config } from '@/lib/r2';

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

    const r2 = getR2Config();
    if (!r2) {
      return NextResponse.json(
        { error: '画像ストレージ（R2）が未設定のためアップロードできません。管理者ダッシュボードのセットアップガイドをご確認ください。' },
        { status: 503 }
      );
    }

    const aws = new AwsClient({
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    // The object key is derived from the session and the validated content
    // type only — the client's filename never reaches the bucket.
    const objectKey = `${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${extensionForImageType(contentType)}`;

    const endpoint = `https://${r2.accountId}.r2.cloudflarestorage.com/${r2.bucketName}/${objectKey}`;

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
      publicUrl: `${r2.publicUrl}/${objectKey}`
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
