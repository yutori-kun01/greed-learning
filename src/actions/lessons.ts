'use server';

import { getDb, runBatch } from '@/db';
import { courses, lessons } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import { sanitizeHtml } from '@/lib/sanitize';
import { normalizeImageUrl } from '@/lib/imageUrl';
import { fetchVideoDuration } from '@/lib/videoDuration';

const db = () => getDb(process.env.DB as unknown as D1Database);

/**
 * Seconds from the form's 分 / 秒 boxes (or a legacy `duration` in seconds).
 * null when both boxes are blank: the length was not given.
 */
function durationSeconds(formData: FormData): number | null {
  const raw = (name: string) => String(formData.get(name) ?? '').trim();
  const num = (name: string) => Math.max(0, parseInt(raw(name)) || 0);
  if (formData.has('durationMinutes') || formData.has('durationSeconds')) {
    if (raw('durationMinutes') === '' && raw('durationSeconds') === '') return null;
    return num('durationMinutes') * 60 + num('durationSeconds');
  }
  return raw('duration') === '' ? null : num('duration');
}

/** The 表示順序 the form asks for, or null when left blank (= automatic). */
function requestedOrder(formData: FormData): number | null {
  const raw = String(formData.get('orderIndex') ?? '').trim();
  if (raw === '') return null;
  const n = parseInt(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** One past the course's highest 表示順序, for a lesson added without one. */
async function nextOrder(courseId: string): Promise<number> {
  const rows = await db()
    .select({ max: sql<number | null>`MAX(${lessons.sortOrder})` })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));
  const max = rows[0]?.max;
  return max == null ? 0 : Number(max) + 1;
}

/** For the admin form: looks up the video's length as soon as a URL is pasted. */
export async function lookupVideoDuration(videoUrl: string): Promise<{ seconds: number | null }> {
  await requireAdmin();
  return { seconds: await fetchVideoDuration(videoUrl) };
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
  
  const videoUrl = ((formData.get('videoUrl') as string) || '').trim();
  const thumbnailUrl = normalizeImageUrl(formData.get('thumbnailUrl'));
  const content = sanitizeHtml(formData.get('content') as string);
  // Blank fields are filled in here: the order goes to the end of the list,
  // and the length is looked up from the video (the form usually has done
  // this already; this covers a URL pasted without waiting for it).
  const [sortOrder, duration] = await Promise.all([
    requestedOrder(formData) ?? nextOrder(courseId),
    durationSeconds(formData) ?? fetchVideoDuration(videoUrl).then((s) => s ?? 0),
  ]);

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

export async function updateLesson(id: string, courseId: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get('title') as string;
  if (!title) throw new Error('タイトルは必須です');

  const videoUrl = ((formData.get('videoUrl') as string) || '').trim();
  const thumbnailUrl = normalizeImageUrl(formData.get('thumbnailUrl'));
  const content = sanitizeHtml(formData.get('content') as string);
  const sortOrder = requestedOrder(formData);
  const duration = durationSeconds(formData) ?? (await fetchVideoDuration(videoUrl)) ?? 0;

  const d = db();
  await runBatch(d, [
    d.update(lessons)
      .set({
        title,
        videoUrl,
        thumbnailUrl,
        content,
        duration,
        // Blank keeps the lesson where it is.
        ...(sortOrder == null ? {} : { sortOrder, number: sortOrder + 1 }),
      })
      .where(and(eq(lessons.id, id), eq(lessons.courseId, courseId))),
    syncCourseTotals(d, courseId),
  ]);

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/lessons/${id}`);
  return { success: true };
}

export async function deleteLesson(id: string, courseId: string) {
  await requireAdmin();

  const d = db();
  await runBatch(d, [d.delete(lessons).where(eq(lessons.id, id)), syncCourseTotals(d, courseId)]);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}
