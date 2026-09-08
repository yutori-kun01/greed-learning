'use client';
import { useState, useRef } from 'react';

type Resource = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  sortOrder: number;
};

export default function ResourcesClient({ 
  resources, 
  onAdd, 
  onDelete 
}: { 
  resources: Resource[], 
  onAdd: (formData: FormData) => Promise<void>,
  onDelete: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const handleUpload = async (file: File, setUrl: (url: string) => void) => {
    try {
      setLoading(true);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      setUrl(data.publicUrl);
    } catch (err) {
      alert('アップロードに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
      <div className="panel">
        <h2 className="panel-title" style={{ marginBottom: '16px' }}>既存のリソース</h2>
        {resources.length === 0 ? (
          <p style={{ color: '#7d8b9f' }}>リソースはまだありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {resources.map((r) => (
              <li key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: '#101d31', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#1a2942', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
                    )}
                    <div>
                      <strong style={{ display: 'block', fontSize: '15px' }}>{r.title}</strong>
                      <span style={{ color: '#7d8b9f', fontSize: '12px' }}>{r.description}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={async () => {
                      if (confirm('本当に削除しますか？')) {
                        setLoading(true);
                        await onDelete(r.id);
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    削除
                  </button>
                </div>
                {r.fileUrl && (
                  <div style={{ fontSize: '12px', color: '#6495ed' }}>
                    🔗 <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{r.fileUrl}</a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2 className="panel-title" style={{ marginBottom: '16px' }}>新規追加</h2>
        <form action={async (fd) => {
          setLoading(true);
          fd.set('imageUrl', imageUrl);
          fd.set('fileUrl', fileUrl);
          await onAdd(fd);
          document.querySelector('form')?.reset();
          setImageUrl('');
          setFileUrl('');
          setLoading(false);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">タイトル</label>
            <input type="text" name="title" className="input" required />
          </div>
          <div>
            <label className="label">説明</label>
            <input type="text" name="description" className="input" />
          </div>
          <div>
            <label className="label">カバー画像 (任意)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], setImageUrl)} 
              style={{ display: 'block', marginBottom: '8px' }}
            />
            {imageUrl && <img src={imageUrl} alt="preview" style={{ width: 120, borderRadius: 4 }} />}
          </div>
          <div>
            <label className="label">ダウンロードファイル (任意)</label>
            <input 
              type="file" 
              accept=".pdf,.zip,.mp4" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], setFileUrl)} 
              style={{ display: 'block', marginBottom: '8px' }}
            />
            {fileUrl && <div style={{ fontSize: 12, color: '#f2d992' }}>アップロード完了: {fileUrl}</div>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>追加する</button>
        </form>
      </div>
    </div>
  );
}
