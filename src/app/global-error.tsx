'use client';

/**
 * Last resort: the root layout itself failed, so this replaces <html>/<body>
 * and cannot rely on the site's stylesheet being applied.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: '#060c17', color: '#e9eef7', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>画面を表示できませんでした</h1>
          <p style={{ fontSize: 14, color: '#b6c1d2', margin: 0 }}>
            しばらくしてからもう一度お試しください。
            {error.digest && <><br />エラーID: {error.digest}</>}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#d9b45b', color: '#23180a', fontWeight: 700, cursor: 'pointer' }}
          >
            再読み込み
          </button>
        </div>
      </body>
    </html>
  );
}
