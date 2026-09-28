'use client';

import React, { useRef, useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

/**
 * Upload-or-paste image field for a form.
 *
 * The chosen URL lives in a hidden input named `name`, so it is saved with the
 * rest of the form by the form's own submit — picking a file uploads it to R2
 * but does not change anything in the database yet.
 */
export default function ImagePicker({
  name,
  initialUrl,
  purpose,
  shape = 'square',
  hint,
  onChange,
}: {
  name: string;
  initialUrl?: string | null;
  purpose: 'image' | 'avatar' | 'thumbnail';
  /** 'wide' previews at 16:9, for thumbnails. */
  shape?: 'square' | 'circle' | 'wide';
  hint?: string;
  /** For forms that keep their values in state instead of reading fields. */
  onChange?: (url: string) => void;
}) {
  const [url, setUrlState] = useState(initialUrl || '');
  const setUrl = (next: string) => {
    setUrlState(next);
    onChange?.(next);
  };
  const [manual, setManual] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, uploadError } = useImageUpload({
    purpose,
    maxWidthOrHeight: purpose === 'avatar' ? 400 : purpose === 'thumbnail' ? 1600 : 1280,
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const uploaded = await uploadImage(file);
    if (uploaded) setUrl(uploaded);
  };

  const radius = shape === 'circle' ? '50%' : shape === 'wide' ? 8 : 12;
  // Preview only what the server will accept; React refuses to render a
  // javascript: src at all and would throw mid-edit.
  const previewable = /^https?:\/\//i.test(url) || url.startsWith('/media/');

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: shape === 'wide' ? 160 : 80, height: shape === 'wide' ? 90 : 80,
            borderRadius: radius, flexShrink: 0, overflow: 'hidden',
            background: 'var(--panel-3)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12,
          }}
        >
          {previewable ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary R2/external hosts, not configured for next/image
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            '未設定'
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" disabled={isUploading} onClick={() => fileInput.current?.click()}>
              {isUploading ? 'アップロード中...' : '画像をアップロード'}
            </button>
            {url && (
              <button type="button" className="btn btn-ghost" disabled={isUploading} onClick={() => setUrl('')}>
                削除
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setManual((v) => !v)}>
              URLで指定
            </button>
          </div>
          {hint && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{hint}</p>}
          {uploadError && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{uploadError}</p>}
        </div>
      </div>
      {manual && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          style={{ display: 'block', width: '100%', marginTop: 12, background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
        />
      )}
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onFile} />
    </div>
  );
}
