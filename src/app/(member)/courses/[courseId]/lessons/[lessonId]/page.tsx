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

      {/* Content & Progress Control */}
      <LessonClientUI 
        lessonId={lesson.id} 
        initialCompleted={isCompleted} 
        content={lesson.content}
        description={lesson.description}
        title={lesson.title}
        embed={embed}
        videoUrl={lesson.videoUrl}
        duration={lesson.duration ?? 0}
        skipWatchRule={user.role === 'ADMIN'}
      />
    </div>
  );
}
