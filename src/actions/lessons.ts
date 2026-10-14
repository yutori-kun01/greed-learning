'use server';

import { getDb, runBatch } from '@/db';
import { courses, lessons } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import { sanitizeHtml } from '@/lib/sanitize';
import { normalizeImageUrl } from '@/lib/imageUrl';

const db = () => getDb(process.env.DB as unknown as D1Database);

/** Seconds from the form's 分 / 秒 boxes (or a legacy `duration` in seconds). */
function durationSeconds(formData: FormData): number {
  const num = (name: string) => Math.max(0, parseInt(formData.get(name) as string) || 0);
  if (formData.has('durationMinutes') || formData.has('durationSeconds')) {
    return num('durationMinutes') * 60 + num('durationSeconds');
  }
  return num('duration');
}

/**
 * Keeps the course's lesson count and total minutes (shown on course cards
 * and in the admin list) in step with its lessons. Runs in the same batch as
 * the lesson write, after it, so it sees the change.
 */
function syncCourseTotals(d: ReturnType<typeof db>, courseId: string) {
  return d.update(courses)
    .set({
      lessonCount: sql`(SELECT COUNT(*) FROM ${lessons} WHERE ${lessons.courseId} = ${courseId})`,
      totalDuration: sql`(SELECT CAST(ROUND(COALESCE(SUM(${lessons.duration}), 0) / 60.0) AS INTEGER) FROM ${lessons} WHERE ${lessons.courseId} = ${courseId})`,
    })
    .where(eq(courses.id, courseId));
}

export async function createLesson(courseId: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get('title') as string;
  if (!title) throw new Error('タイトルは必須です');
  
  const videoUrl = formData.get('videoUrl') as string;
  const thumbnailUrl = normalizeImageUrl(formData.get('thumbnailUrl'));
  const content = sanitizeHtml(formData.get('content') as string);
  const sortOrder = parseInt(formData.get('orderIndex') as string) || 0;
  const duration = durationSeconds(formData);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const d = db();
  await runBatch(d, [d.insert(lessons).values({
    id,
    courseId,
    number: sortOrder + 1,
    title,
    videoUrl,
    thumbnailUrl,
    content,
    sortOrder,
    duration,
    createdAt: now,
  }), syncCourseTotals(d, courseId)]);

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true, lessonId: id };
}

export async function deleteLesson(id: string, courseId: string) {
  await requireAdmin();

  const d = db();
  await runBatch(d, [d.delete(lessons).where(eq(lessons.id, id)), syncCourseTotals(d, courseId)]);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}
