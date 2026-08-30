import Link from 'next/link';
import { getSiteSettingsQuery } from '@/actions/settings';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || 'N8N MARKETING';

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
