import Link from 'next/link';
import { getSiteSettingsQuery } from '@/lib/queries';
import { DEFAULT_SITE_NAME } from '@/lib/brand';

// These pages read operator details out of D1, which has no binding during
// `next build`. Prerendered, they would permanently serve the "（未設定）"
// placeholders the build saw — on the 特定商取引法 page that is a legal
// disclosure the operator cannot fix from the admin UI. Render per request.
export const dynamic = 'force-dynamic';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ color: 'var(--gold-2)', fontSize: 13, textDecoration: 'none' }}>← {siteName} トップへ戻る</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
