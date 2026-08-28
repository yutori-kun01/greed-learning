'use server';

import { getDb } from '@/db';
import { lessonProgress, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

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

  // Update user's streak logic could go here
  // For simplicity, we just update lastActivityDate
  await db().update(user).set({
    lastActivityDate: now
  }).where(eq(user.id, userId));

  revalidatePath('/courses');
  revalidatePath('/dashboard');
  revalidatePath('/learning');
  revalidatePath(`/courses/[courseId]/lessons/${lessonId}`, 'page');
  
  return { success: true, isCompleted };
}
