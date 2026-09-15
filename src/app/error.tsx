'use client';

import { useEffect } from 'react';

/**
 * Catches render-time failures (a D1 hiccup, a bad query) so members see the
 * site's own message and a way forward instead of the default Next.js screen.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Workers Logs (wrangler tail) で追跡できるようにしておく。
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="status-page">
      <p className="status-code">エラー</p>
      <h1 className="status-title">画面を表示できませんでした</h1>
      <p className="status-note">
        一時的な問題の可能性があります。しばらくしてからもう一度お試しください。
        {error.digest && <><br />エラーID: {error.digest}</>}
      </p>
      <button type="button" className="btn btn-gold" onClick={reset}>再読み込み</button>
    </div>
  );
}
