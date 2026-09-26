'use server';

import { getDb } from '@/db';
import { lessonProgress, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { advanceStreak } from '@/lib/streak';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function toggleLessonComplete(lessonId: string, isCompleted: boolean) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const now = new Date().toISOString();

  // Upsert the lesson progress
  const existing = await db().select().from(lessonProgress).where(
    and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.lessonId, lessonId)
    )
  ).limit(1);

  if (existing.length > 0) {
    await db().update(lessonProgress).set({
      isCompleted,
      completedAt: isCompleted ? now : null
    }).where(eq(lessonProgress.id, existing[0].id));
  } else {
    await db().insert(lessonProgress).values({
      id: crypto.randomUUID(),
      userId,
      lessonId,
      isCompleted,
      watchedSeconds: 0,
      completedAt: isCompleted ? now : null
    });
  }

  // 完了にしたときだけ学習記録として数える（完了解除は記録を伸ばさない）。
  if (isCompleted) {
    const rows = await db().select().from(user).where(eq(user.id, userId)).limit(1);
    const me = rows[0];
    if (me) {
      const next = advanceStreak(
        {
          currentStreak: me.currentStreak ?? 0,
          longestStreak: me.longestStreak ?? 0,
          lastActivityDate: me.lastActivityDate ?? null,
        },
        new Date(now)
      );
      await db().update(user).set({
        currentStreak: next.currentStreak,
        longestStreak: next.longestStreak,
        lastActivityDate: next.lastActivityDate,
      }).where(eq(user.id, userId));
    }
  }

  revalidatePath('/', 'layout'); // サイドバーの学習記録
  revalidatePath('/courses');
  revalidatePath('/dashboard');
  revalidatePath('/learning');
  revalidatePath(`/courses/[courseId]/lessons/${lessonId}`, 'page');
  
  return { success: true, isCompleted };
}
