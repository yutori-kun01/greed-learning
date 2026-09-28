import { useState } from 'react';
import imageCompression from 'browser-image-compression';

type UploadPurpose = 'image' | 'avatar' | 'thumbnail';

export function useImageUpload({ purpose = 'image', maxWidthOrHeight = 1280 }: { purpose?: UploadPurpose; maxWidthOrHeight?: number } = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Compress image
      const options = {
        maxSizeMB: purpose === 'avatar' ? 1.5 : 5,
        maxWidthOrHeight,
        useWebWorker: true,
      };
      
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await imageCompression(file, options);
      }

      // 2. Send the bytes to the Worker, which verifies and stores them in R2.
      const params = new URLSearchParams({ purpose, filename: file.name });
      const res = await fetch(`/api/upload?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': fileToUpload.type || 'application/octet-stream' },
        body: fileToUpload,
      });

      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'アップロードに失敗しました');
      }

      return data.url;
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError((err as Error).message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, uploadError };
}
