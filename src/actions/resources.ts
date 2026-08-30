'use server';

import { getDb } from '@/db';
import { courseResources } from '@/db/schema';
import { eq, inArray, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

const db = () => getDb(process.env.DB as unknown as D1Database);

async function requireAdmin() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function getCourseResources(courseId: string) {
  try {
    return await db().select().from(courseResources).where(eq(courseResources.courseId, courseId)).orderBy(asc(courseResources.sortOrder));
  } catch (e) {
    return [];
  }
}

export async function getResourcesForCourses(courseIds: string[]) {
  if (courseIds.length === 0) return [];
  try {
    return await db().select().from(courseResources).where(inArray(courseResources.courseId, courseIds)).orderBy(asc(courseResources.sortOrder));
  } catch (e) {
    return [];
  }
}

export async function createCourseResource(courseId: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get('title') as string;
  if (!title) throw new Error('タイトルは必須です');
  const icon = (formData.get('icon') as string) || '📄';
  const description = formData.get('description') as string;
  const fileUrl = formData.get('fileUrl') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  await db().insert(courseResources).values({
    id: crypto.randomUUID(),
    courseId,
    icon,
    title,
    description,
    fileUrl,
    sortOrder,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath('/resources');
  return { success: true };
}

export async function deleteCourseResource(id: string, courseId: string) {
  await requireAdmin();
  await db().delete(courseResources).where(eq(courseResources.id, id));
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath('/resources');
  return { success: true };
}
