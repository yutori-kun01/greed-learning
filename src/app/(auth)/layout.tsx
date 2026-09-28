import React from 'react';
import Link from 'next/link';
import { getSiteSettingsQuery } from '@/lib/queries';
import { TurnstileProvider } from '@/components/Turnstile';
import { DEFAULT_LOGO_URL, DEFAULT_SITE_NAME } from '@/lib/brand';

// Reads site settings, which change at runtime; never prerender.
export const dynamic = 'force-dynamic';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  return (
    <div className="auth-page">
      <Link href="/" className="auth-brand">
        <span className="brand-mark brand-mark-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- operator-supplied host */}
          <img src={settings?.logoUrl || DEFAULT_LOGO_URL} alt="" />
        </span>
        <span>{siteName}</span>
      </Link>
      <TurnstileProvider siteKey={process.env.TURNSTILE_SITE_KEY || null}>{children}</TurnstileProvider>
    </div>
  );
}
