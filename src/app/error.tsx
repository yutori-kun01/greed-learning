'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Catches render and data errors below the root layout. Without this the
 * Workers runtime serves its own error page and the cause is only visible to
 * someone watching `wrangler tail`.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] Unhandled error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div className="panel" style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>問題が発生しました</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          ページを表示できませんでした。時間をおいて再度お試しください。
          解決しない場合はサポートまでご連絡ください。
        </p>
        {error.digest && (
          <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 24, fontFamily: 'monospace' }}>
            エラーID: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn btn-gold">再試行</button>
          <Link href="/" className="btn btn-ghost">トップへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
