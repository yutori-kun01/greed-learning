import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RightRail from '@/components/layout/RightRail';
import Footer from '@/components/layout/Footer';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSiteSettings, DEFAULT_SITE_NAME } from '@/lib/siteSettings';
import { getMemberProgress } from '@/lib/progress';
import { getDb } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// The streak lives on the user row; a missing table (fresh local DB) should not
// take the whole shell down.
async function loadStreaks(userId: string) {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    const rows = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

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

  const progress = await getMemberProgress(session.user.id);
  const me = await loadStreaks(session.user.id);

  return (
    <div className="app">
      <Sidebar
        siteName={siteName}
        logoUrl={settings?.logoUrl}
        discordUrl={settings?.discordUrl}
        stats={{
          completedThisMonth: progress.completedThisMonth,
          completedLastMonth: progress.completedLastMonth,
          weeklyCompletions: progress.weeklyCompletions,
          currentStreak: me?.currentStreak ?? 0,
          longestStreak: me?.longestStreak ?? 0,
        }}
      />
      <div className="main">
        <Topbar />
        <div className="content">
          {children}
          <RightRail progress={progress} />
        </div>
        <Footer siteName={siteName} />
      </div>
    </div>
  );
}
