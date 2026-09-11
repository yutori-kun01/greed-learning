import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getSiteSettingsQuery } from '@/lib/queries';
import { optionalUser } from '@/lib/session';

// Reads operator/site settings out of D1, which has no binding at build time.
export const dynamic = 'force-dynamic';

/**
 * Chrome for pages readable without signing in. Deliberately not the member
 * layout: that one redirects anonymous visitors to /login, which is what made
 * "publicly published" articles unreachable to the public.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || 'N8N MARKETING';
  const me = await optionalUser();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 28px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Link
          href={me ? '/dashboard' : '/posts'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}
        >
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={siteName} style={{ height: 28 }} />
          ) : (
            <strong style={{ fontSize: 16, letterSpacing: '0.04em' }}>{siteName}</strong>
          )}
        </Link>

        <nav style={{ display: 'flex', gap: 16, marginLeft: 8, fontSize: 14 }}>
          <Link href="/posts" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>記事</Link>
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          {me ? (
            <Link href="/dashboard" className="btn btn-gold">会員ページ</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">ログイン</Link>
              <Link href="/signup" className="btn btn-gold">会員登録</Link>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '40px 28px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>{children}</div>
      </main>

      <Footer siteName={siteName} />
    </div>
  );
}
