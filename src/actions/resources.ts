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
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  // Either an external link or a file already uploaded to R2 by the form.
  const fileUrl = ((formData.get('fileUrl') as string) || '').trim() || null;
  const objectKey = ((formData.get('objectKey') as string) || '').trim() || null;
  const fileName = ((formData.get('fileName') as string) || '').trim() || null;
  const rawSize = parseInt(formData.get('fileSize') as string, 10);
  const fileSize = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : null;

  if (fileUrl && !/^https?:\/\//i.test(fileUrl)) {
    throw new Error('ダウンロードURLは http:// または https:// で始まる必要があります');
  }

  await db().insert(courseResources).values({
    id: crypto.randomUUID(),
    courseId,
    icon,
    title,
    description,
    // An uploaded file wins: it is the one we can gate properly.
    fileUrl: objectKey ? null : fileUrl,
    objectKey,
    fileName,
    fileSize,
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
