import React from 'react';
import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import LessonClientUI from './LessonClientUI';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function LessonPage({ params }: { params: Promise<{ courseId: string, lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    return null; // Handled by proxy.ts
  }

  // Fetch course and lesson
  const courseData = await db().select().from(courses).where(eq(courses.id, courseId)).limit(1);
  const lessonData = await db().select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);

  // For development/preview: if no lesson in DB, use mock data
  const course = courseData[0] || {
    id: courseId,
    title: 'リード獲得の全体設計',
    number: '01'
  };

  const lesson = lessonData[0] || {
    id: lessonId,
    courseId: courseId,
    title: '1. コンセプトメイクの重要性',
    description: 'なぜコンセプトが最も重要なのか、具体的な事例を交えて解説します。',
    content: '<p>ここはエディタで作成された本文コンテンツが入ります。</p>',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Dummy video
    number: 1,
    duration: 15
  };

  // Fetch progress
  const progressData = await db().select().from(lessonProgress).where(
    and(
      eq(lessonProgress.userId, session.user.id),
      eq(lessonProgress.lessonId, lessonId)
    )
  ).limit(1);

  const isCompleted = progressData[0]?.isCompleted || false;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 64 }}>
      {/* Breadcrumb / Top info */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--gold2)', fontWeight: 600, marginBottom: 8 }}>
          {course.number}. {course.title}
        </p>
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 0 }}>
          {lesson.number}. {lesson.title}
        </h1>
      </div>

      {/* Video Player */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, background: '#000' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          {lesson.videoUrl ? (
            <iframe 
              src={lesson.videoUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7d8b9f' }}>
              動画が設定されていません
            </div>
          )}
        </div>
      </div>

      {/* Content & Progress Control */}
      <LessonClientUI 
        lessonId={lesson.id} 
        initialCompleted={isCompleted} 
        content={lesson.content}
        description={lesson.description}
      />
    </div>
  );
}
