import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RightRail from '@/components/layout/RightRail';
import Footer from '@/components/layout/Footer';
import { currentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSiteSettingsQuery } from '@/lib/queries';
import { getCourseProgressOverview } from '@/lib/courseProgress';
import { getGamificationSummary } from '@/lib/gamification';
import { DEFAULT_SITE_NAME } from '@/lib/brand';

// Every page under here renders live, per-account data. None of it may be
// prerendered or shared between users, and a page that does not itself call
// a request-time API would otherwise be generated at build time against no
// database at all.
export const dynamic = 'force-dynamic';

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  // The cached lookup, so the page's requireUser() reuses this one instead of
  // asking D1 for the session a second time.
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  }
  if (user.status === 'SUSPENDED') {
    redirect('/login?suspended=1');
  }

  const [settings, overview, summary] = await Promise.all([
    getSiteSettingsQuery(),
    getCourseProgressOverview(user.id),
    getGamificationSummary(user.id),
  ]);
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;

  return (
    <div className="app">
      <Sidebar
        siteName={siteName}
        logoUrl={settings?.logoUrl}
        currentStreak={summary.currentStreak}
        longestStreak={summary.longestStreak}
      />
      <div className="main">
        <Topbar />
        <div className="content">
          {children}
          <RightRail overview={overview} />
        </div>
        <Footer siteName={siteName} />
      </div>
    </div>
  );
}
