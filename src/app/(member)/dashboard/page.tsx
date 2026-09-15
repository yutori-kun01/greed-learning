import Link from 'next/link';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getMemberProgress } from '@/lib/progress';

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

  const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  const currentUser = userData[0];

  // Progress is computed once per request and shared with the right rail.
  const progress = await getMemberProgress(session.user.id);
  const activeCourses = (progress.inProgress.length > 0 ? progress.inProgress : progress.courses).slice(0, 3);

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
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{progress.completedLessonCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完了したレッスン</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{currentUser?.currentStreak || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>連続学習日数</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>
            {progress.completedCourseCount}<span style={{ fontSize: 16, color: 'var(--muted)' }}> / {progress.totalCourseCount}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完了した講座</div>
        </div>
      </div>

      <div>
        <h2 className="section-title">学習中のコース</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {activeCourses.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>現在学習中のコースはありません。</div>
          ) : activeCourses.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)', overflow: 'hidden' }}>
                {c.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : c.badge ? (
                  <span className="badge badge-gold">{c.badge}</span>
                ) : null}
              </div>
              <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
                <div className="progress">
                  <div className="bar"><span style={{ width: `${c.percent}%` }}></span></div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                  進捗: {c.percent}%（{c.completedLessons} / {c.totalLessons} レッスン）
                </div>
                <Link href={`/courses/${c.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center' }}>
                  {c.status === 'not_started' ? '学習を始める' : '学習を続ける'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
