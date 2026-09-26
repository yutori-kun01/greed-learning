import Link from 'next/link';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getMemberProgress } from '@/lib/progress';

export default async function LearningPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;

  if (!userId) return null;

  // Same computation the right rail and dashboard use.
  const progress = await getMemberProgress(userId);
  const startedCourses = progress.courses.filter(c => c.completedLessons > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">学習中の講座</h1>
      {startedCourses.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          まだ学習中の講座はありません。
        </div>
      ) : (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {startedCourses.map((course) => (
            <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)', overflow: 'hidden' }}>
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : course.badge ? (
                  <span className="badge">{course.badge}</span>
                ) : null}
              </div>
              <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ marginBottom: '16px', fontSize: '15px' }}>{course.title}</h3>
                <div className="progress">
                  <div className="bar"><span style={{ width: `${course.percent}%` }}></span></div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                  進捗: {course.percent}%（{course.completedLessons} / {course.totalLessons} レッスン）
                </div>
                <Link href={`/courses/${course.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}>詳細を見る</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
