import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RightRail from '@/components/layout/RightRail';
import Footer from '@/components/layout/Footer';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSiteSettingsQuery } from '@/lib/queries';

// Every page under here renders live, per-account data. None of it may be
// prerendered or shared between users, and a page that does not itself call
// a request-time API would otherwise be generated at build time against no
// database at all.
export const dynamic = 'force-dynamic';

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

  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || 'N8N MARKETING';

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
