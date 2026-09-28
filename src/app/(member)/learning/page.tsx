import Link from 'next/link';
import { getDb } from '@/db';
import { courses, lessonProgress, lessons } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { requireUser } from '@/lib/session';
import { getAccessibleCourseIds } from '@/lib/access';

export default async function LearningPage() {
  const me = await requireUser();
  const d1 = process.env.DB as unknown as D1Database;
  const db = getDb(d1);

  // Start from the member's own completed lessons rather than every lesson in
  // the database — this page used to load all courses and all lessons and do
  // the joining in memory.
  const completed = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, me.id), eq(lessonProgress.isCompleted, true)));

  if (completed.length === 0) {
    return <EmptyState />;
  }

  const completedIds = completed.map((p: { lessonId: string }) => p.lessonId);

  const completedLessonRows: Array<{ courseId: string }> = await db
    .select({ courseId: lessons.courseId })
    .from(lessons)
    .where(inArray(lessons.id, completedIds));

  const startedCourseIds: string[] = [
    ...new Set(completedLessonRows.map((l) => l.courseId)),
  ];

  if (startedCourseIds.length === 0) {
    return <EmptyState />;
  }

  const startedCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      badge: courses.badge,
      requiredPlanId: courses.requiredPlanId,
    })
    .from(courses)
    .where(inArray(courses.id, startedCourseIds));

  // A course the member has since lost access to should not stay on the page.
  const accessibleIds = await getAccessibleCourseIds(d1, me.id, startedCourses);
  const visible = startedCourses.filter((c: { id: string }) => accessibleIds.has(c.id));

  const courseLessons = visible.length
    ? await db
        .select({ id: lessons.id, courseId: lessons.courseId })
        .from(lessons)
        .where(inArray(lessons.courseId, visible.map((c: { id: string }) => c.id)))
    : [];

  const completedSet = new Set(completedIds);
  const counts = new Map<string, { total: number; done: number }>();
  for (const lesson of courseLessons as Array<{ id: string; courseId: string }>) {
    const entry = counts.get(lesson.courseId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (completedSet.has(lesson.id)) entry.done += 1;
    counts.set(lesson.courseId, entry);
  }

  if (visible.length === 0) {
    return <EmptyState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">学習中の講座</h1>
      <div
        className="grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}
      >
        {visible.map((course: { id: string; title: string; badge: string | null }) => {
          const { total, done } = counts.get(course.id) ?? { total: 0, done: 0 };
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                {course.badge && <span className="badge">{course.badge}</span>}
              </div>
              <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="card-title" style={{ marginBottom: '16px', fontSize: '15px' }}>{course.title}</h3>
                <div className="progress">
                  <div className="bar"><span style={{ width: `${percent}%` }}></span></div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                  {done} / {total} レッスン完了（{percent}%）
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  className="btn btn-gold btn-block"
                  style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}
                >
                  詳細を見る
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="section-title">学習中の講座</h1>
      <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
        まだ学習中の講座はありません。
      </div>
    </div>
  );
}
