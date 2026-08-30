'use server';

import { getDb } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function createCourse(formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const number = formData.get('number') as string;
  const title = formData.get('title') as string;
  if (!title) {
    throw new Error('タイトルは必須です');
  }
  const description = formData.get('description') as string;
  const categoryId = formData.get('categoryId') as string;
  const status = formData.get('status') as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  const badge = formData.get('badge') as string;
  const requiredPlanId = (formData.get('requiredPlanId') as string) || null;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db().insert(courses).values({
    id,
    number,
    title,
    description,
    categoryId,
    status: status || 'DRAFT',
    badge,
    requiredPlanId,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath('/admin/courses');
  return { success: true, courseId: id };
}

export async function updateCourse(id: string, formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const number = formData.get('number') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoryId = formData.get('categoryId') as string;
  const status = formData.get('status') as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  const badge = formData.get('badge') as string;
  const requiredPlanId = (formData.get('requiredPlanId') as string) || null;

  const now = new Date().toISOString();

  await db().update(courses)
    .set({
      number,
      title,
      description,
      categoryId,
      status,
      badge,
      requiredPlanId,
      updatedAt: now,
    })
    .where(eq(courses.id, id));

  revalidatePath('/admin/courses');
  revalidatePath(`/courses/${id}`);
  return { success: true };
}

export async function getCourses() {
  try {
    return await db().select().from(courses).orderBy(courses.createdAt);
  } catch (e) {
    return [];
  }
}

export async function deleteCourse(id: string) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db().delete(courses).where(eq(courses.id, id));
  revalidatePath('/admin/courses');
  return { success: true };
}
