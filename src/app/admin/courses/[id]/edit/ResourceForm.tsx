'use client';

import React, { useRef, useState } from 'react';
import { createCourseResource } from '@/actions/resources';

type Uploaded = { objectKey: string; fileName: string; fileSize: number };

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  color: 'var(--text)',
  padding: '10px',
  borderRadius: '6px',
  marginBottom: '12px',
};

export default function ResourceForm({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          purpose: 'resource',
        }),
      });

      const data = (await res.json()) as { uploadUrl?: string; objectKey?: string; error?: string };
      if (!res.ok || !data.uploadUrl || !data.objectKey) {
        throw new Error(data.error || 'アップロードURLの取得に失敗しました');
      }

      const put = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error('ファイルのアップロードに失敗しました');

      setUploaded({ objectKey: data.objectKey, fileName: file.name, fileSize: file.size });
    } catch (err) {
      setError((err as Error).message);
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (uploaded) {
        formData.set('objectKey', uploaded.objectKey);
        formData.set('fileName', uploaded.fileName);
        formData.set('fileSize', String(uploaded.fileSize));
      }
      await createCourseResource(courseId, formData);
      formRef.current?.reset();
      setUploaded(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          name="icon"
          placeholder="絵文字"
          defaultValue="📄"
          style={{ ...inputStyle, width: 70, flex: 'none', textAlign: 'center' }}
        />
        <input type="text" name="title" placeholder="リソース名" required style={{ ...inputStyle, flex: 1 }} />
      </div>

      <textarea name="description" placeholder="説明 (任意)" rows={2} style={inputStyle} />

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
          ファイルをアップロード
        </label>
        <input
          ref={fileRef}
          type="file"
          disabled={uploading || loading}
          style={{ ...inputStyle, marginBottom: 6, padding: 8 }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>アップロード中...</p>}
        {uploaded && (
          <p style={{ fontSize: 12, color: '#6fd0a0', margin: 0 }}>
            ✓ {uploaded.fileName}（{Math.max(1, Math.round(uploaded.fileSize / 1024))} KB）
          </p>
        )}
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.6 }}>
          アップロードしたファイルは、閲覧権限のある会員だけが短時間有効なリンクで受け取れます。
        </p>
      </div>

      <input
        type="text"
        name="fileUrl"
        placeholder="または外部URL（Notion・動画など）"
        style={inputStyle}
        disabled={Boolean(uploaded)}
      />

      {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <button type="submit" disabled={loading || uploading} className="btn btn-gold btn-block">
        {loading ? '追加中...' : '追加する'}
      </button>
    </form>
  );
}
