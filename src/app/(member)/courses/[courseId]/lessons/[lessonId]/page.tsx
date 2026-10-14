import React from 'react';
import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { preconnect } from 'react-dom';
import { currentUser } from '@/lib/session';
import { canOpenCourse } from '@/lib/journeyState';
import LessonClientUI from './LessonClientUI';
import { videoEmbed } from '@/lib/videoEmbed';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function LessonPage({ params }: { params: Promise<{ courseId: string, lessonId: string }> }) {
  const { courseId, lessonId } = await params;

  // The layout already looked the session up; this reuses that lookup.
  const user = await currentUser();
  if (!user) {
    return null; // Handled by proxy.ts
  }

  // Course, lesson and progress do not depend on each other: one round trip
  // for all three instead of three in a row.
  const [courseData, lessonData, progressData] = await Promise.all([
    db().select().from(courses).where(eq(courses.id, courseId)).limit(1),
    db().select().from(lessons).where(eq(lessons.id, lessonId)).limit(1),
    db().select().from(lessonProgress).where(
      and(
        eq(lessonProgress.userId, user.id),
        eq(lessonProgress.lessonId, lessonId)
      )
    ).limit(1),
  ]);

  if (courseData.length === 0 || lessonData.length === 0 || lessonData[0].courseId !== courseId) {
    notFound();
  }

  const course = courseData[0];
  const lesson = lessonData[0];

  const hasAccess = await canOpenCourse(process.env.DB as unknown as D1Database, user.id, course);
  if (!hasAccess) {
    redirect(`/courses/${courseId}`);
  }

  const isCompleted = progressData[0]?.isCompleted || false;
  const embed = videoEmbed(lesson.videoUrl);
  // Opens the connection to the video host while the page is still
  // streaming, so the player starts sooner (Loom's first load was slow).
  if (embed) {
    preconnect(new URL(embed.src).origin);
    if (embed.provider === 'loom') preconnect('https://cdn.loom.com');
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 64 }}>
      {/* Breadcrumb / Top info */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--gold-2)', fontWeight: 600, marginBottom: 8 }}>
          {course.number}. {course.title}
        </p>
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 0 }}>
          {lesson.number}. {lesson.title}
        </h1>
      </div>

      {/* Video Player */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, background: '#000' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          {embed ? (
            <iframe
              src={embed.src}
              title={lesson.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : lesson.videoUrl && /^https?:\/\//i.test(lesson.videoUrl) ? (
            // Not a provider we can frame: link out instead of a broken iframe.
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', padding: 24, textAlign: 'center' }}>
              <span>この動画はサイト内で再生できない形式です。</span>
              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">動画を新しいタブで開く</a>
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
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
