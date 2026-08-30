import Link from 'next/link';

export default function Footer({ siteName }: { siteName: string }) {
  return (
    <footer style={{ padding: '24px 28px', borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
      <span>&copy; {new Date().getFullYear()} {siteName}</span>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/legal/tokushoho" style={{ color: 'var(--muted)' }}>特定商取引法に基づく表記</Link>
        <Link href="/legal/terms" style={{ color: 'var(--muted)' }}>利用規約</Link>
        <Link href="/legal/privacy" style={{ color: 'var(--muted)' }}>プライバシーポリシー</Link>
      </div>
    </footer>
  );
}
