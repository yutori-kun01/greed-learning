import Link from 'next/link';
import { getDb } from '@/db';
import { courses, lessonProgress, lessons } from '@/db/schema';
import { eq, inArray, sql, count } from 'drizzle-orm';
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
  const startedCourseData = await db
    .select({ courseId: lessons.courseId })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(eq(lessonProgress.userId, userId))
    .groupBy(lessons.courseId);

  const courseIds = startedCourseData.map((r: any) => r.courseId).filter(Boolean);
  
  if (courseIds.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 className="section-title">学習中の講座</h1>
        <div className="panel" style={{ textAlign: 'center', padding: '40px', color: '#7d8b9f' }}>
          まだ学習中の講座はありません。
        </div>
      </div>
    );
  }

  const [startedCourses, progressData] = await Promise.all([
    db.select().from(courses).where(inArray(courses.id, courseIds)),
    db.select({
      courseId: lessons.courseId,
      total: count(lessons.id),
      completed: count(sql`CASE WHEN ${lessonProgress.isCompleted} = 1 THEN 1 END`),
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(eq(lessonProgress.userId, userId))
    .groupBy(lessons.courseId),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">学習中の講座</h1>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {startedCourses.map((course: any) => {
          const stats = progressData.find((p: any) => p.courseId === course.id);
          const completedCount = stats?.completed || 0;
          const totalCount = stats?.total || 1; // avoid division by zero
          const progressPercent = Math.round((completedCount / totalCount) * 100);
          
          return (
            <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="thumb" style={{ aspectRatio: '2.2/1', background: '#101d31' }}>
                {course.badge && <span className="badge">{course.badge}</span>}
              </div>
              <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ marginBottom: '16px', fontSize: '15px' }}>{course.title}</h3>
                <div className="progress">
                  <div className="bar"><span style={{ width: `${progressPercent}%` }}></span></div>
                </div>
                <div style={{ fontSize: '12px', color: '#7d8b9f', marginTop: '8px', marginBottom: '16px' }}>
                  進捗: {progressPercent}%
                </div>
                <Link href={`/courses/${course.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}>詳細を見る</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
