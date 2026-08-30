import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import Icon from '@/components/Icon';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;
  
  if (!userId) return notFound();

  const db = getDb(process.env.DB as unknown as D1Database);
  
  // Get course details
  const courseList = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (courseList.length === 0) return notFound();
  const course = courseList[0];

  // Get lessons
  const courseLessons = await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.sortOrder));
  
  // Get progress
  const progressList = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
  const completedLessonIds = new Set(progressList.filter((p: any) => p.isCompleted).map((p: any) => p.lessonId));

  const totalLessons = courseLessons.length;
  const courseLessonIds = new Set(courseLessons.map((l: any) => l.id));
  const completedCount = [...completedLessonIds].filter(id => courseLessonIds.has(id)).length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  return (
    <div>
      <div className="section-title">
        <Link href="/courses" style={{ color: 'inherit', textDecoration: 'none', marginRight: '8px' }}>
          ← 戻る
        </Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ marginLeft: '8px' }}>{course.title}</span>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text)' }}>{course.title}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          {course.description || "説明はありません。"}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>進捗状況</span>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{progressPercent}%</span>
            </div>
            <div className="progress">
              <div className="bar"><span style={{ width: `${progressPercent}%` }}></span></div>
            </div>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
            {completedCount} / {totalLessons} レッスン完了
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text)', marginTop: '32px' }}>カリキュラム</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {courseLessons.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            まだレッスンが登録されていません。
          </div>
        ) : (
          courseLessons.map((lesson: any, idx: number) => {
            const isCompleted = completedLessonIds.has(lesson.id);
            return (
              <Link 
                key={lesson.id} 
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="panel" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px 20px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: isCompleted ? '1px solid rgba(217, 180, 91, 0.3)' : undefined
                }}>
                  <div style={{ 
                    width: '32px', height: '32px', 
                    borderRadius: '50%', 
                    background: isCompleted ? 'var(--gold)' : 'var(--line)',
                    color: isCompleted ? 'var(--bg)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '14px',
                    marginRight: '16px'
                  }}>
                    {isCompleted ? '✓' : (idx + 1)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', color: isCompleted ? 'var(--text)' : 'var(--text-2)', fontWeight: 500, marginBottom: '4px' }}>
                      {lesson.title}
                    </div>
                    {lesson.duration > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="clock" /> {Math.floor(lesson.duration / 60)}分
                      </div>
                    )}
                  </div>
                  
                  <div style={{ color: 'var(--gold)', opacity: 0.7 }}>
                    <Icon name="chevron-right" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
