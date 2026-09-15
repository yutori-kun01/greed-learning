import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { MAX_IMAGE_BYTES, MAX_IMAGE_LABEL, isAllowedImageType } from '@/lib/uploads';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!isAllowedImageType(file.type)) {
      setUploadError('PNG / JPEG / WebP / GIF のみアップロードできます');
      return null;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Compress. GIFs are left alone — re-encoding drops the animation.
      let fileToUpload = file;
      if (file.type !== 'image/gif') {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: MAX_IMAGE_BYTES / 1024 / 1024,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        });
      }

      if (fileToUpload.size > MAX_IMAGE_BYTES) {
        setUploadError(`ファイルサイズは${MAX_IMAGE_LABEL}までです`);
        return null;
      }

      // 2. Get Presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: fileToUpload.type,
          size: fileToUpload.size,
        }),
      });

      if (!res.ok) {
        const message = await res
          .json()
          .then((body) => (body as { error?: string }).error)
          .catch(() => null);
        throw new Error(message || 'アップロードURLの取得に失敗しました');
      }

      const data = await res.json();
      const { uploadUrl, publicUrl } = data as { uploadUrl: string; publicUrl: string };

      // 3. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileToUpload.type,
        },
        body: fileToUpload,
      });

      if (!uploadRes.ok) {
        throw new Error('ストレージへのアップロードに失敗しました');
      }

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'アップロードに失敗しました');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, uploadError };
}
