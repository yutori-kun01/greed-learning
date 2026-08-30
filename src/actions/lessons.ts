'use server';

import { getDb } from '@/db';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/sanitize';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function createLesson(courseId: string, formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  if (!title) throw new Error('タイトルは必須です');
  
  const videoUrl = formData.get('videoUrl') as string;
  const content = sanitizeHtml(formData.get('content') as string);
  const sortOrder = parseInt(formData.get('orderIndex') as string) || 0;
  const duration = parseInt(formData.get('duration') as string) || 0;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db().insert(lessons).values({
    id,
    courseId,
    number: sortOrder + 1,
    title,
    videoUrl,
    content,
    sortOrder,
    duration,
    createdAt: now,
  });

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true, lessonId: id };
}

export async function deleteLesson(id: string, courseId: string) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db().delete(lessons).where(eq(lessons.id, id));
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  return { success: true };
}
