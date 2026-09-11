'use client';

import { useEffect } from 'react';

/**
 * Last resort: an error thrown by the root layout itself, where no app chrome
 * or theme tokens are available. It must render its own <html> and <body>,
 * and cannot rely on globals.css having applied, so the colours here are
 * literal rather than tokens.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] Root layout error:', error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e1116',
          color: '#e8e6e1',
          fontFamily: 'system-ui, -apple-system, "Hiragino Sans", sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>問題が発生しました</h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#a9a8a2', marginBottom: 24 }}>
            サイトを読み込めませんでした。時間をおいて再度お試しください。
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: '#7d7d78', marginBottom: 24, fontFamily: 'monospace' }}>
              エラーID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#d9b45b',
              color: '#23180a',
              border: 'none',
              borderRadius: 6,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
