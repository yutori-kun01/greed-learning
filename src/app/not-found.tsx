import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="status-page">
      <p className="status-code">404</p>
      <h1 className="status-title">ページが見つかりません</h1>
      <p className="status-note">
        URLが変更されたか、閲覧できる権限がない可能性があります。
      </p>
      <Link href="/courses" className="btn btn-gold">講座一覧へ戻る</Link>
    </div>
  );
}
