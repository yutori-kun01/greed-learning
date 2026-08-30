import Link from 'next/link';
import { getDb } from '@/db';
import { courses, lessonProgress, lessons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function LearningPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;

  if (!userId) return null;

  const db = getDb(process.env.DB as unknown as D1Database);
  
  // Get all courses the user has started (has progress)
  const allCourses = await db.select().from(courses);
  const allLessons = await db.select().from(lessons);
  const userProgress = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));

  const startedCourseIds = new Set(
    userProgress
      .map((p: any) => allLessons.find((l: any) => l.id === p.lessonId)?.courseId)
      .filter(Boolean)
  );
  
  const startedCourses = allCourses.filter((c: any) => startedCourseIds.has(c.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">学習中の講座</h1>
      {startedCourses.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          まだ学習中の講座はありません。
        </div>
      ) : (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {startedCourses.map((course: any) => {
            const courseLessons = allLessons.filter((l: any) => l.courseId === course.id);
            const courseLessonIds = new Set(courseLessons.map((l: any) => l.id));
            const completedCount = userProgress.filter((p: any) => courseLessonIds.has(p.lessonId) && p.isCompleted).length;
            const progressPercent = courseLessons.length > 0 ? Math.round((completedCount / courseLessons.length) * 100) : 0;
            
            return (
              <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                  {course.badge && <span className="badge">{course.badge}</span>}
                </div>
                <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px', fontSize: '15px' }}>{course.title}</h3>
                  <div className="progress">
                    <div className="bar"><span style={{ width: `${progressPercent}%` }}></span></div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                    進捗: {progressPercent}%
                  </div>
                  <Link href={`/courses/${course.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}>詳細を見る</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
