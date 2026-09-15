import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RightRail from '@/components/layout/RightRail';
import Footer from '@/components/layout/Footer';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSiteSettings, DEFAULT_SITE_NAME } from '@/lib/siteSettings';

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    redirect('/login');
  }
  if ((session.user as any).status === 'SUSPENDED') {
    redirect('/login?suspended=1');
  }

  const settings = await getSiteSettings();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  return (
    <div className="app">
      <Sidebar siteName={siteName} logoUrl={settings?.logoUrl} />
      <div className="main">
        <Topbar />
        <div className="content">
          {children}
          <RightRail />
        </div>
        <Footer siteName={siteName} />
      </div>
    </div>
  );
}
