import Link from 'next/link';

export default function NotFound() {
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
      <div className="panel" style={{ maxWidth: 440, textAlign: 'center', padding: 40 }}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>ページが見つかりません</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          お探しのページは削除されたか、URLが変更された可能性があります。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/posts" className="btn btn-ghost">記事一覧</Link>
          <Link href="/" className="btn btn-gold">トップへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
