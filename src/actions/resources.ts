'use server';

import { getDb } from '@/db';
import { courseResources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';

const db = () => getDb(process.env.DB as unknown as D1Database);

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
