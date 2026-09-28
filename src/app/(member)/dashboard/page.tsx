import Link from 'next/link';
import { getDb } from '@/db';
import { courses, lessonProgress, lessons } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { requireUser } from '@/lib/session';
import { getAccessibleCourseIds } from '@/lib/access';
import { getGamificationSummary } from '@/lib/gamification';
import LevelCard from '@/components/gamification/LevelCard';
import BadgeShelf from '@/components/gamification/BadgeShelf';

export default async function DashboardPage() {
  const me = await requireUser();
  const db = getDb(process.env.DB as unknown as D1Database);
  const d1 = process.env.DB as unknown as D1Database;

  const summary = await getGamificationSummary(me.id);

  // Courses the member has actually started, with their real progress. This
  // panel used to show an arbitrary three courses at a hardcoded 0%.
  const allCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      badge: courses.badge,
      requiredPlanId: courses.requiredPlanId,
    })
    .from(courses)
    .where(eq(courses.status, 'PUBLISHED'));

  const accessibleIds = await getAccessibleCourseIds(d1, me.id, allCourses);
  const visibleCourses = allCourses.filter((c: { id: string }) => accessibleIds.has(c.id));

  const lessonRows = visibleCourses.length
    ? await db
        .select({ id: lessons.id, courseId: lessons.courseId })
        .from(lessons)
        .where(inArray(lessons.courseId, visibleCourses.map((c: { id: string }) => c.id)))
    : [];

  const completedRows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, me.id), eq(lessonProgress.isCompleted, true)));
  const completedIds = new Set(completedRows.map((r: { lessonId: string }) => r.lessonId));

  const byCourse = new Map<string, { total: number; done: number }>();
  for (const lesson of lessonRows as Array<{ id: string; courseId: string }>) {
    const entry = byCourse.get(lesson.courseId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (completedIds.has(lesson.id)) entry.done += 1;
    byCourse.set(lesson.courseId, entry);
  }

  type CourseCard = {
    id: string;
    title: string;
    badge: string | null;
    total: number;
    done: number;
    percent: number;
  };

  const withProgress: CourseCard[] = visibleCourses.map(
    (course: { id: string; title: string; badge: string | null }) => {
      const counts = byCourse.get(course.id) ?? { total: 0, done: 0 };
      return {
        id: course.id,
        title: course.title,
        badge: course.badge,
        ...counts,
        percent: counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0,
      };
    }
  );

  const inProgress = withProgress
    .filter((c) => c.done > 0 && c.done < c.total)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  const nextUp = withProgress.filter((c) => c.done === 0).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="panel">
        <h1 className="panel-title">ようこそ、{me.name}さん</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
          {summary.currentStreak > 0
            ? `${summary.currentStreak}日連続で学習中です。今日も続けましょう。`
            : '今日から学習を始めて、連続記録をつくりましょう。'}
        </p>
      </div>

      <LevelCard summary={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.completedLessons}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完了したレッスン</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.completedCourses}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>完走した講座</div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.currentStreak}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            連続学習日数{summary.longestStreak > 0 && `（最長 ${summary.longestStreak}日）`}
          </div>
        </div>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: 'var(--gold-2)', fontWeight: 'bold' }}>{summary.totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>獲得ポイント</div>
        </div>
      </div>

      <BadgeShelf earned={summary.badges} />

      <div>
        <h2 className="section-title">学習中の講座</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {inProgress.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              現在学習中の講座はありません。
            </div>
          ) : (
            inProgress.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                  {c.badge && <span className="badge badge-gold">{c.badge}</span>}
                </div>
                <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
                  <div className="progress">
                    <div className="bar"><span style={{ width: `${c.percent}%` }}></span></div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', marginBottom: '16px' }}>
                    {c.done} / {c.total} レッスン完了（{c.percent}%）
                  </div>
                  <Link href={`/courses/${c.id}`} className="btn btn-gold btn-block" style={{ marginTop: 'auto', textAlign: 'center' }}>
                    学習を続ける
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {nextUp.length > 0 && (
        <div>
          <h2 className="section-title">次に始める講座</h2>
          <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {nextUp.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="thumb" style={{ aspectRatio: '2.2/1', background: 'var(--panel-2)' }}>
                  {c.badge && <span className="badge badge-gold">{c.badge}</span>}
                </div>
                <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>{c.title}</h3>
                  <Link href={`/courses/${c.id}`} className="btn btn-ghost btn-block" style={{ marginTop: 'auto', textAlign: 'center' }}>
                    講座を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
