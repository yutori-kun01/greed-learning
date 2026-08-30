import Link from 'next/link';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDb } from '@/db';
import { user, lessonProgress, courses } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    return null; // Handled by proxy
  }

  const db = getDb(process.env.DB as unknown as D1Database);

  // Fetch real stats
  const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  const currentUser = userData[0];

  const completedLessons = await db.select({ value: count() })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, session.user.id));

  const totalCompleted = completedLessons[0]?.value || 0;

  // Recent active courses (mocked logic for now as we don't have enrollments table yet, just fetch top 3 courses)
  const activeCourses = await db.select().from(courses).limit(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="panel">
        <h1 className="panel-title">ようこそ、{currentUser?.name || session.user.name}さん</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
          本日の学習目標に向かって頑張りましょう。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{totalCompleted}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完了したレッスン</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{currentUser?.currentStreak || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>連続学習日数</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>0</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>獲得ポイント</div>
        </div>
      </div>

      <div>
        <h2 className="section-title">学習中のコース</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {activeCourses.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>現在学習中のコースはありません。</div>
          ) : activeCourses.map((c: any, i: number) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                {c.badge && <span className={`badge badge-gold`}>{c.badge}</span>}
              </div>
              <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
                <div className="progress">
                  <div className="bar"><span style={{ width: `0%` }}></span></div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                  進捗: 0%
                </div>
                <Link href={`/courses/${c.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center' }}>
                  学習を続ける
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
