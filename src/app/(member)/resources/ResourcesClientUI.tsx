'use client';

import { useState } from 'react';

type Resource = {
  id: string;
  icon: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
};

type Status = 'idle' | 'downloading' | 'done';

export default function ResourcesClientUI({ resources }: { resources: Resource[] }) {
  const [status, setStatus] = useState<Record<string, Status>>({});

  const handleDownload = (res: Resource) => {
    if (res.fileUrl) {
      window.open(res.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (status[res.id] === 'downloading') return;
    setStatus(prev => ({ ...prev, [res.id]: 'downloading' }));
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [res.id]: 'done' }));
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">リソース・特典</h1>
      {resources.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          現在ご利用いただけるリソースはありません。
        </div>
      ) : (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {resources.map((res) => {
            const s = status[res.id] || 'idle';
            return (
              <div key={res.id} className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{res.icon}</div>
                <h3 className="panel-title" style={{ marginBottom: '8px' }}>{res.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px', flexGrow: 1 }}>{res.description}</p>
                <button
                  className={`btn ${s === 'done' ? 'btn-ghost' : 'btn-gold'}`}
                  style={{ width: '100%' }}
                  disabled={s === 'downloading'}
                  onClick={() => handleDownload(res)}
                >
                  {s === 'downloading' ? 'ダウンロード中...' : s === 'done' ? '✓ ダウンロード済み' : 'ダウンロード'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
