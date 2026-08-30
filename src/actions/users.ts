'use server';

import { getDb } from '@/db';
import { user, plans, lessonProgress } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
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
  return session;
}

export async function getUsers() {
  await requireAdmin();

  const users = await db().select().from(user).orderBy(desc(user.createdAt));
  const allPlans = await db().select().from(plans);
  const planById = new Map(allPlans.map((p: any) => [p.id, p.name]));

  return users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    lastActivityDate: u.lastActivityDate,
    planName: u.planId ? planById.get(u.planId) || null : null,
    subscriptionStatus: u.subscriptionStatus,
    noteId: u.noteId,
  }));
}

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
