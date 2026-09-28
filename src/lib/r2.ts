import 'server-only';

import { AwsClient } from 'aws4fetch';

/**
 * R2 access over the S3-compatible API. Workers bindings are not used here
 * because uploads are signed for the browser to PUT directly, and downloads
 * are signed so the object itself never needs a public URL.
 */

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function client(config: R2Config) {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
}

function objectUrl(config: R2Config, objectKey: string): URL {
  return new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${objectKey}`
  );
}

/**
 * A URL the browser may PUT exactly this content type and byte count to.
 * Both are part of the signature, so the upload cannot become something else
 * after approval.
 */
export async function signUpload(
  config: R2Config,
  objectKey: string,
  contentType: string,
  size: number,
  ttlSeconds = 300
): Promise<string> {
  const url = objectUrl(config, objectKey);
  url.searchParams.set('X-Amz-Expires', String(ttlSeconds));

  const signed = await client(config).sign(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(size),
    },
    aws: { signQuery: true },
  });

  return signed.url;
}

/**
 * A short-lived URL for reading one object. Minted per request after the
 * caller's access has been checked, so the link in a member's browser stops
 * working long before it could usefully be forwarded.
 */
export async function signDownload(
  config: R2Config,
  objectKey: string,
  fileName: string | null,
  ttlSeconds = 120
): Promise<string> {
  const url = objectUrl(config, objectKey);
  url.searchParams.set('X-Amz-Expires', String(ttlSeconds));
  if (fileName) {
    url.searchParams.set(
      'response-content-disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
  }

  const signed = await client(config).sign(url.toString(), {
    method: 'GET',
    aws: { signQuery: true },
  });

  return signed.url;
}
