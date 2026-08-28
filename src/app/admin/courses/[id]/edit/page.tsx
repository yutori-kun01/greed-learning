import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import Icon from '@/components/Icon';
import LessonForm from './LessonForm';
import LessonList from './LessonList';

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
          {/* Note: Full update form omitted for brevity, focusing on read-only + lessons here */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#b6c1d2', fontSize: '13px' }}>タイトル</label>
            <input type="text" defaultValue={course.title} readOnly style={{ width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,0.07)', color: '#e9eef7', padding: '10px', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#b6c1d2', fontSize: '13px' }}>説明</label>
            <textarea defaultValue={course.description || ''} readOnly rows={4} style={{ width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,0.07)', color: '#e9eef7', padding: '10px', borderRadius: '6px' }} />
          </div>
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
