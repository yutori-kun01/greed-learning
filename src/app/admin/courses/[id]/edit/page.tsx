import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import LessonForm from './LessonForm';
import LessonList from './LessonList';
import CourseInfoForm from './CourseInfoForm';

export default async function AdminCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb(process.env.DB as unknown as D1Database);

  const courseList = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (courseList.length === 0) return notFound();
  const course = courseList[0];

  const courseLessons = await db.select().from(lessons).where(eq(lessons.courseId, id)).orderBy(asc(lessons.sortOrder));

  return (
    <div>
      <div className="section-title">
        <Link href="/admin/courses" style={{ color: 'inherit', textDecoration: 'none', marginRight: '8px' }}>
          ← 戻る
        </Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ marginLeft: '8px' }}>講座の編集</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="panel">
          <h2 className="panel-title">基本情報</h2>
          <CourseInfoForm
            course={{
              id: course.id,
              number: course.number,
              title: course.title,
              description: course.description,
              categoryId: course.categoryId,
              status: course.status,
              badge: course.badge,
            }}
          />
        </div>

        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>レッスン管理</h2>
          
          <LessonList lessons={courseLessons} courseId={id} />

          <div className="panel" style={{ marginTop: '24px' }}>
            <h2 className="panel-title">新規レッスン追加</h2>
            <LessonForm courseId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
