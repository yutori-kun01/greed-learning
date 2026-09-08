'use client';
import { useState } from 'react';

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export default function CategoriesClient({ 
  categories, 
  onAdd, 
  onDelete 
}: { 
  categories: Category[], 
  onAdd: (formData: FormData) => Promise<void>,
  onDelete: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
      <div className="panel">
        <h2 className="panel-title" style={{ marginBottom: '16px' }}>既存のカテゴリ</h2>
        {categories.length === 0 ? (
          <p style={{ color: '#7d8b9f' }}>カテゴリはまだありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.map((c) => (
              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#101d31', borderRadius: '6px' }}>
                <div>
                  <strong>{c.name}</strong> <span style={{ color: '#7d8b9f', marginLeft: '8px' }}>({c.slug})</span>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={async () => {
                    if (confirm('本当に削除しますか？')) {
                      setLoading(true);
                      await onDelete(c.id);
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2 className="panel-title" style={{ marginBottom: '16px' }}>新規追加</h2>
        <form action={async (fd) => {
          setLoading(true);
          await onAdd(fd);
          // reset form
          document.querySelector('form')?.reset();
          setLoading(false);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">表示名 (例: マーケティング)</label>
            <input type="text" name="name" className="input" required />
          </div>
          <div>
            <label className="label">スラッグ (例: marketing)</label>
            <input type="text" name="slug" className="input" required pattern="[a-zA-Z0-9-]+" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>追加する</button>
        </form>
      </div>
    </div>
  );
}
