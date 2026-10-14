'use server';

import { getDb } from '@/db';
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

/**
 * Akinai hub product ids and the purchase link for a course sold there.
 * Products are stored as a JSON array, or null when the course is not sold.
 * Returns {} (no change) when the form did not include the store section.
 */
function storeFields(formData: FormData): { akinaiProductIds?: string | null; purchaseUrl?: string | null } | { error: string } {
  // The section is only rendered while Akinai hub is connected; without it the
  // form says nothing about these columns, so leave them as they are.
  if (formData.get('akinaiFields') !== '1') return {};
  const products = idList(formData, 'akinaiProductIds').filter((id) => id.length <= 100);
  const url = String(formData.get('purchaseUrl') ?? '').trim();
  if (url && !/^https:\/\/[^\s]+$/.test(url)) return { error: '購入ページのURLは https:// から入力してください' };
  return { akinaiProductIds: products.length ? JSON.stringify(products) : null, purchaseUrl: url || null };
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

  const existing = await db().select({ id: courses.id }).from(courses).where(inArray(courses.id, requested));
  const ids = existing.map((c: { id: string }) => c.id);

  const edges = await db()
    .select({ courseId: coursePrerequisites.courseId, requiredCourseId: coursePrerequisites.requiredCourseId })
    .from(coursePrerequisites);
  if (wouldCreateCycle(edges, courseId, ids)) {
    return { error: '前提講座が循環しています（この講座を前提にしている講座を、この講座の前提にはできません）' };
  }
  return ids;
}

/** Replaces the course's tags and prerequisites with what the form holds. */
async function saveRelations(courseId: string, tagIds: string[], prerequisiteIds: string[]) {
  await db().delete(courseTags).where(eq(courseTags.courseId, courseId));
  if (tagIds.length > 0) {
    const known = await db().select({ id: tags.id }).from(tags).where(inArray(tags.id, tagIds));
    for (const t of known as Array<{ id: string }>) {
      await db().insert(courseTags).values({ id: crypto.randomUUID(), courseId, tagId: t.id });
    }
  }

  await db().delete(coursePrerequisites).where(eq(coursePrerequisites.courseId, courseId));
  for (const requiredCourseId of prerequisiteIds) {
    await db().insert(coursePrerequisites).values({ id: crypto.randomUUID(), courseId, requiredCourseId });
  }
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
  const store = storeFields(formData);
  if ('error' in store) return { success: false, error: store.error };

  // A new course cannot be anyone's prerequisite yet, so no cycle is possible.
  const prerequisiteIds = await validPrerequisites(id, formData);
  if (!Array.isArray(prerequisiteIds)) return { success: false, error: prerequisiteIds.error };

  await db().insert(courses).values({
    id,
    number,
    title,
    description,
    categoryId,
    status: status || 'DRAFT',
    badge,
    requiredPlanId,
    thumbnailUrl,
    ...store,
    ...journeyFields(formData),
    createdAt: now,
    updatedAt: now,
  });
  await saveRelations(id, idList(formData, 'tagIds'), prerequisiteIds);

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
  const store = storeFields(formData);
  if ('error' in store) return { success: false, error: store.error };

  const prerequisiteIds = await validPrerequisites(id, formData);
  if (!Array.isArray(prerequisiteIds)) return { success: false, error: prerequisiteIds.error };

  await db().update(courses)
    .set({
      number,
      title,
      description,
      categoryId,
      status,
      badge,
      requiredPlanId,
      thumbnailUrl,
      ...store,
      ...journeyFields(formData),
      updatedAt: now,
    })
    .where(eq(courses.id, id));
  await saveRelations(id, idList(formData, 'tagIds'), prerequisiteIds);

  refresh(id);
  return { success: true, courseId: id };
}

export async function deleteCourse(id: string) {
  await requireAdmin();

  await db().delete(courses).where(eq(courses.id, id));
  revalidatePath('/admin/courses');
  return { success: true };
}
