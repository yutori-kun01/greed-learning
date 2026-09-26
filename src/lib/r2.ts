/**
 * R2 credentials for the presigned-upload route.
 *
 * Uploads go through R2's S3-compatible API with an explicit access key (not
 * the `R2_ASSETS` Workers binding), because the browser PUTs the file straight
 * to R2 with a presigned URL. That needs five separate values, so they are
 * read in one place and surfaced in the admin setup checklist.
 */
export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    // A trailing slash would produce "…//key" in every stored image URL.
    publicUrl: publicUrl.replace(/\/+$/, ''),
  };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}
