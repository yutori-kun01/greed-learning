import React from 'react';
import Link from 'next/link';
import { getSiteSettings, DEFAULT_SITE_NAME } from '@/lib/siteSettings';

/**
 * Article pages live outside the member area: public and paid articles are
 * shared publicly (there are X share buttons on them), and under the member
 * layout a logged-out visitor following such a link was redirected to /login
 * instead of seeing the article.
 */
export default async function PostLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  return (
    <div style={{ minHeight: '100vh', color: 'var(--text)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div className="auth-brand" style={{ marginBottom: 28 }}>
          <Link href="/" className="auth-brand-mark" aria-hidden="true">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="" />
            ) : (
              <svg viewBox="0 0 40 40">
                <path d="M8 30V11l12 13V11l12 19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                <circle cx="20" cy="6" r="2.4" fill="currentColor" />
              </svg>
            )}
          </Link>
          <Link href="/" className="auth-brand-text" style={{ textDecoration: 'none' }}>{siteName}</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
