import React from 'react';
import { getSiteSettings, DEFAULT_SITE_NAME } from '@/lib/siteSettings';

/**
 * Shared shell for the auth screens: the site's own brand above the card, and
 * the card centered on the site background (including the configured pattern).
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  return (
    <div className="auth-container">
      <div className="auth-brand">
        <span className="auth-brand-mark" aria-hidden="true">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="" />
          ) : (
            <svg viewBox="0 0 40 40">
              <path d="M8 30V11l12 13V11l12 19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="20" cy="6" r="2.4" fill="currentColor" />
            </svg>
          )}
        </span>
        <span className="auth-brand-text">{siteName}</span>
      </div>
      {children}
    </div>
  );
}
