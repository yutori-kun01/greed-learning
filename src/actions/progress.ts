'use server';

import { getDb } from '@/db';
import { lessonProgress, lessons, courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { canAccessCourse } from '@/lib/access';
import { recordLessonCompletion } from '@/lib/gamification';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function toggleLessonComplete(lessonId: string, isCompleted: boolean) {
  const user = await requireUser();

  // The lesson id arrives straight from the client, so the course it belongs
  // to has to be re-checked here. Without this any member could mark any
  // lesson of any course complete, including courses they cannot open.
  const lessonRows = await db()
    .select({ id: lessons.id, courseId: lessons.courseId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  const lesson = lessonRows[0];
  if (!lesson) throw new Error('レッスンが見つかりません');

  const courseRows = await db()
    .select({ id: courses.id, requiredPlanId: courses.requiredPlanId })
    .from(courses)
    .where(eq(courses.id, lesson.courseId))
    .limit(1);
  const course = courseRows[0];
  if (!course) throw new Error('講座が見つかりません');

  const hasAccess = await canAccessCourse(
    process.env.DB as unknown as D1Database,
    user.id,
    course
  );
  if (!hasAccess) throw new Error('この講座にはアクセスできません');

  const now = new Date().toISOString();

  const existing = await db()
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  const wasCompleted = existing[0]?.isCompleted ?? false;

  if (existing[0]) {
    await db()
      .update(lessonProgress)
      .set({ isCompleted, completedAt: isCompleted ? now : null })
      .where(eq(lessonProgress.id, existing[0].id));
  } else {
    await db().insert(lessonProgress).values({
      id: crypto.randomUUID(),
      userId: user.id,
      lessonId,
      isCompleted,
      watchedSeconds: 0,
      completedAt: isCompleted ? now : null,
    });
  }

  // Points and streaks only move forward, and only the first time a given
  // lesson is completed — otherwise toggling the checkbox farms points.
  const reward =
    isCompleted && !wasCompleted
      ? await recordLessonCompletion(user.id, lesson.courseId)
      : null;

  revalidatePath('/courses');
  revalidatePath('/dashboard');
  revalidatePath('/learning');
  revalidatePath(`/courses/${lesson.courseId}`);

  return { success: true, isCompleted, reward };
}
