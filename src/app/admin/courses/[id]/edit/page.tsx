import React from 'react';
import { requireAdmin } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import LessonForm from './LessonForm';
import LessonList from './LessonList';
import CourseInfoForm from './CourseInfoForm';
import ResourceForm from './ResourceForm';
import ResourceList from './ResourceList';
import { getCategories, getCourseTagMap, getPlansForAdmin, getPrerequisiteIdsForAdmin, getTags } from '@/lib/queries';
import { getCourseResourcesForAdmin } from '@/lib/queries';

export default async function AdminCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  // The layout's redirect streams in parallel with this page, so check here
  // too rather than run admin queries for a non-admin first.
  await requireAdmin();
  const { id } = await params;
  const db = getDb(process.env.DB as unknown as D1Database);

  const courseList = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (courseList.length === 0) return notFound();
  const course = courseList[0];

  const courseLessons = await db.select().from(lessons).where(eq(lessons.courseId, id)).orderBy(asc(lessons.sortOrder));
  const plans = await getPlansForAdmin();
  const categories = await getCategories();
  const resources = await getCourseResourcesForAdmin(id);
  const [tags, tagMap, prerequisiteIds] = await Promise.all([getTags(), getCourseTagMap(), getPrerequisiteIdsForAdmin(id)]);
  const otherCourses = (await db
    .select({ id: courses.id, number: courses.number, title: courses.title })
    .from(courses)
    .orderBy(asc(courses.createdAt)))
    .filter((c: { id: string }) => c.id !== id);

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
              requiredPlanId: course.requiredPlanId,
              thumbnailUrl: course.thumbnailUrl,
              tagIds: tagMap.get(id) ?? [],
              prerequisiteIds,
              unlockCompletedCourses: course.unlockCompletedCourses,
              unlockPoints: course.unlockPoints,
              isHidden: course.isHidden,
            }}
            plans={plans}
            categories={categories}
            tags={tags}
            otherCourses={otherCourses}
          />
        </div>

        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>レッスン管理</h2>
          
          <LessonList lessons={courseLessons} courseId={id} />

          <div className="panel" style={{ marginTop: '24px' }}>
            <h2 className="panel-title">新規レッスン追加</h2>
            <LessonForm courseId={id} />
          </div>

          <h2 className="section-title" style={{ marginTop: 32 }}>コース特典・リソース</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -8, marginBottom: 16 }}>
            この講座にアクセスできる会員だけが「リソース・特典」ページで閲覧できます。
          </p>

          <ResourceList resources={resources} courseId={id} />

          <div className="panel" style={{ marginTop: '24px' }}>
            <h2 className="panel-title">新規リソース追加</h2>
            <ResourceForm courseId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
