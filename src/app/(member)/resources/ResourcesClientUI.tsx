'use client';

import { useState } from 'react';

export type ResourceCard = {
  id: string;
  icon: string;
  title: string;
  description: string | null;
  /** Whether anything is actually attached — a link or an uploaded file. */
  hasDownload: boolean;
  fileName: string | null;
  fileSize: number | null;
  isExternal: boolean;
};

function formatSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ResourcesClientUI({ resources }: { resources: ResourceCard[] }) {
  const [error, setError] = useState<string | null>(null);

  // Goes through the download route, which re-checks access and only then
  // reveals the destination. Previously a resource with no file at all faked
  // a download with a timer and reported "ダウンロード済み".
  const open = (res: ResourceCard) => {
    setError(null);
    window.open(`/api/resources/${res.id}/download`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">リソース・特典</h1>

      {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

      {resources.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          現在ご利用いただけるリソースはありません。
        </div>
      ) : (
        <div
          className="grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}
        >
          {resources.map((res) => {
            const size = formatSize(res.fileSize);
            return (
              <div
                key={res.id}
                className="panel"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{res.icon}</div>
                <h3 className="panel-title" style={{ marginBottom: '8px' }}>{res.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', flexGrow: 1 }}>
                  {res.description}
                </p>

                {(res.fileName || size) && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
                    {res.fileName}
                    {res.fileName && size && ' · '}
                    {size}
                  </div>
                )}

                {res.hasDownload ? (
                  <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => open(res)}>
                    {res.isExternal ? '開く' : 'ダウンロード'}
                  </button>
                ) : (
                  <button className="btn btn-ghost" style={{ width: '100%' }} disabled>
                    準備中
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
