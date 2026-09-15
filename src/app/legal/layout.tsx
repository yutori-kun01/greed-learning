import Link from 'next/link';
import { getSiteSettings, DEFAULT_SITE_NAME } from '@/lib/siteSettings';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  // 背景は body（サイト設定の背景パターン）に任せ、ここでは塗りつぶさない。
  return (
    <div style={{ minHeight: '100vh', color: 'var(--text)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ color: 'var(--gold-2)', fontSize: 13, textDecoration: 'none' }}>← {siteName} トップへ戻る</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
