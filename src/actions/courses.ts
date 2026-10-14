'use server';

import { getDb, runBatch } from '@/db';
import { coursePrerequisites, courseTags, courses, tags } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import { normalizeImageUrl } from '@/lib/imageUrl';
import { parseThreshold, wouldCreateCycle } from '@/lib/journey';

const db = () => getDb(process.env.DB as unknown as D1Database);

export type CourseResult = { success: true; courseId: string } | { success: false; error: string };

function journeyFields(formData: FormData) {
  return {
    unlockCompletedCourses: parseThreshold(formData.get('unlockCompletedCourses')),
    unlockPoints: parseThreshold(formData.get('unlockPoints')),
    isHidden: formData.get('isHidden') === 'on',
  };
}

function idList(formData: FormData, name: string): string[] {
  return [...new Set(formData.getAll(name).filter((v): v is string => typeof v === 'string' && v !== ''))];
}

/**
 * Checks the prerequisites a form asks for. Returns the ids to save, or an
 * error when they would lock a course behind itself.
 */
async function validPrerequisites(courseId: string, formData: FormData): Promise<string[] | { error: string }> {
  const requested = idList(formData, 'prerequisiteIds').filter((id) => id !== courseId);
  if (requested.length === 0) return [];

  const [existing, edges] = await Promise.all([
    db().select({ id: courses.id }).from(courses).where(inArray(courses.id, requested)),
    db()
      .select({ courseId: coursePrerequisites.courseId, requiredCourseId: coursePrerequisites.requiredCourseId })
      .from(coursePrerequisites),
  ]);
  const ids = existing.map((c: { id: string }) => c.id);
  if (wouldCreateCycle(edges, courseId, ids)) {
    return { error: '前提講座が循環しています（この講座を前提にしている講座を、この講座の前提にはできません）' };
  }
  return ids;
}

/** The tag ids from the form that still exist. */
async function validTags(formData: FormData): Promise<string[]> {
  const requested = idList(formData, 'tagIds');
  if (requested.length === 0) return [];
  const known = await db().select({ id: tags.id }).from(tags).where(inArray(tags.id, requested));
  return known.map((t: { id: string }) => t.id);
}

/** Checks the form's tags and prerequisites together (one round trip, not two). */
async function validRelations(courseId: string, formData: FormData) {
  const [tagIds, prerequisiteIds] = await Promise.all([validTags(formData), validPrerequisites(courseId, formData)]);
  return { tagIds, prerequisiteIds };
}

/** Writes that replace the course's tags and prerequisites with what the form holds. */
function relationWrites(d: ReturnType<typeof db>, courseId: string, tagIds: string[], prerequisiteIds: string[]) {
  // One statement per row: still a single batch, and it stays clear of D1's
  // bound-parameter limit however many tags a course gets.
  return [
    d.delete(courseTags).where(eq(courseTags.courseId, courseId)),
    ...tagIds.map((tagId) => d.insert(courseTags).values({ id: crypto.randomUUID(), courseId, tagId })),
    d.delete(coursePrerequisites).where(eq(coursePrerequisites.courseId, courseId)),
    ...prerequisiteIds.map((requiredCourseId) =>
      d.insert(coursePrerequisites).values({ id: crypto.randomUUID(), courseId, requiredCourseId })
    ),
  ];
}

function refresh(courseId: string) {
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
  revalidatePath(`/courses/${courseId}`);
  revalidatePath('/dashboard');
}

export async function createCourse(formData: FormData): Promise<CourseResult> {
  await requireAdmin();

  const number = formData.get('number') as string;
  const title = formData.get('title') as string;
  if (!title) {
    return { success: false, error: 'タイトルは必須です' };
  }
  const description = formData.get('description') as string;
  const categoryId = (formData.get('categoryId') as string) || null;
  const status = formData.get('status') as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  const badge = formData.get('badge') as string;
  const requiredPlanId = (formData.get('requiredPlanId') as string) || null;
  const thumbnailUrl = normalizeImageUrl(formData.get('thumbnailUrl'));

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // A new course cannot be anyone's prerequisite yet, so no cycle is possible.
  const { tagIds, prerequisiteIds } = await validRelations(id, formData);
  if (!Array.isArray(prerequisiteIds)) return { success: false, error: prerequisiteIds.error };

  // The course row and its relations go to D1 in one batch.
  const d = db();
  await runBatch(d, [d.insert(courses).values({
    id,
    number,
    title,
    description,
    categoryId,
    status: status || 'DRAFT',
    badge,
    requiredPlanId,
    thumbnailUrl,
    ...journeyFields(formData),
    createdAt: now,
    updatedAt: now,
  }), ...relationWrites(d, id, tagIds, prerequisiteIds)]);

  refresh(id);
  return { success: true, courseId: id };
}

export async function updateCourse(id: string, formData: FormData): Promise<CourseResult> {
  await requireAdmin();

  const number = formData.get('number') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoryId = (formData.get('categoryId') as string) || null;
  const status = formData.get('status') as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  const badge = formData.get('badge') as string;
  const requiredPlanId = (formData.get('requiredPlanId') as string) || null;
  const thumbnailUrl = normalizeImageUrl(formData.get('thumbnailUrl'));

  const now = new Date().toISOString();

  const { tagIds, prerequisiteIds } = await validRelations(id, formData);
  if (!Array.isArray(prerequisiteIds)) return { success: false, error: prerequisiteIds.error };

  const d = db();
  await runBatch(d, [d.update(courses)
    .set({
      number,
      title,
      description,
      categoryId,
      status,
      badge,
      requiredPlanId,
      thumbnailUrl,
      ...journeyFields(formData),
      updatedAt: now,
    })
    .where(eq(courses.id, id)), ...relationWrites(d, id, tagIds, prerequisiteIds)]);

  refresh(id);
  return { success: true, courseId: id };
}

export async function deleteCourse(id: string) {
  await requireAdmin();

  await db().delete(courses).where(eq(courses.id, id));
  revalidatePath('/admin/courses');
  return { success: true };
}
