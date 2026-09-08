import React from 'react';
import Icon from '../Icon';
import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';

export default async function RightRail() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return null; // Guests don't see progress
  }

  const db = getDb(process.env.DB as unknown as D1Database);
  const userId = session.user.id;

  // Get total completed lessons
  const totalCompletedQuery = await db.select({ count: sql<number>`count(*)` })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));
  
  const completedLessons = totalCompletedQuery[0]?.count || 0;

  // Since we don't have a simple way to count total available lessons vs enrolled, 
  // we'll mock the total count for the summary donut (e.g. out of 50 total lessons)
  const totalLessonsInAppQuery = await db.select({ count: sql<number>`count(*)` }).from(lessons);
  const totalLessonsInApp = totalLessonsInAppQuery[0]?.count || 1;
  const progressPercent = Math.min(100, Math.round((completedLessons / totalLessonsInApp) * 100));

  return (
    <aside className="rail">
      <section className="panel">
        <h3 className="panel-title">学習の進捗サマリー</h3>
        <div className="summary">
          <div className="donut" style={{ '--value': progressPercent } as React.CSSProperties}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="donut-track" cx="50" cy="50" r="42"></circle>
              <circle className="donut-value" cx="50" cy="50" r="42"></circle>
            </svg>
          </div>
          <div className="summary-text">
            <p className="summary-label">総合進捗</p>
            <p className="summary-value">{progressPercent}<span>%</span></p>
          </div>
        </div>
        <ul className="stats">
          <li><Icon name="check" /><span>完了レッスン</span><b>{completedLessons}<em> / {totalLessonsInApp}</em></b></li>
        </ul>
        <Link href="/learning" className="btn btn-ghost btn-block" style={{ textDecoration: 'none', textAlign: 'center' }}>
          <Icon name="edit" />学習プランを確認
        </Link>
      </section>

      <section className="panel">
        <h3 className="panel-title">おすすめの次のステップ</h3>
        <p className="panel-note">次に取り組むのにおすすめの講座です。</p>
        <Link href="/courses" className="btn btn-gold btn-block" style={{ textDecoration: 'none', textAlign: 'center' }}>
          <Icon name="play" />講座を探す
        </Link>
      </section>
    </aside>
  );
}
