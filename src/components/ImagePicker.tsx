'use client';
import React, { useRef, useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ALLOWED_IMAGE_ACCEPT, MAX_IMAGE_LABEL } from '@/lib/uploads';

/**
 * Picks an image, uploads it to R2 through the presigned-URL route, and hands
 * the public URL back. The caller owns the value, so nothing is persisted
 * until the surrounding form is saved.
 */
export default function ImagePicker({
  value,
  onChange,
  shape = 'circle',
  size = 80,
  label = '画像をアップロード',
  hint,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  shape?: 'circle' | 'square';
  size?: number;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, uploadError } = useImageUpload();
  const [failedToLoad, setFailedToLoad] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    e.target.value = '';
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      setFailedToLoad(false);
      onChange(url);
    }
  };

  const borderRadius = shape === 'circle' ? '50%' : 8;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          background: 'var(--panel-3)',
          border: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {value && !failedToLoad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            onError={() => setFailedToLoad(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: size / 3 }}>🖼️</span>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'アップロード中...' : label}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setFailedToLoad(false);
                onChange(null);
              }}
              disabled={isUploading}
            >
              削除
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          {hint || `PNG / JPEG / WebP / GIF・${MAX_IMAGE_LABEL}まで`}
        </p>
        {failedToLoad && value && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>画像を読み込めませんでした</p>
        )}
        {uploadError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{uploadError}</p>}
      </div>
    </div>
  );
}
