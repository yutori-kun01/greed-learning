import { useState } from 'react';
import imageCompression from 'browser-image-compression';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Compress image
      const options = {
        maxSizeMB: 5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await imageCompression(file, options);
      }

      // 2. Get Presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: fileToUpload.type,
          // Signed into the upload URL, so it must match the body exactly.
          size: fileToUpload.size,
          purpose: 'image',
        }),
      });

      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(detail?.error || 'Failed to get upload URL');
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
        throw new Error('Failed to upload to storage');
      }

      return publicUrl;
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
