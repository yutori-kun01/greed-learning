'use server';

import { getDb } from '@/db';
import { user, lessonProgress } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function getUserCompletedLessonCount(userId: string) {
  await requireAdmin();
  const result = await db()
    .select({ value: count() })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));
  return result[0]?.value || 0;
}

export async function setUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
  await requireAdmin();

  const target = await db().select().from(user).where(eq(user.id, userId)).limit(1);
  if (target[0]?.role === 'ADMIN') {
    throw new Error('管理者アカウントは停止できません');
  }

  await db().update(user).set({ status }).where(eq(user.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}
