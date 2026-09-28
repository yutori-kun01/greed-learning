import React from 'react';
import Link from 'next/link';
import { getSiteSettingsQuery } from '@/lib/queries';

// Reads site settings, which change at runtime; never prerender.
export const dynamic = 'force-dynamic';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || 'N8N MARKETING';

  return (
    <div className="auth-page">
      <Link href="/" className="auth-brand">
        {settings?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- operator-supplied host
          <img src={settings.logoUrl} alt="" />
        )}
        <span>{siteName}</span>
      </Link>
      {children}
    </div>
  );
}
