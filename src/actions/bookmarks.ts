'use server';

import { getDb } from '@/db';
import { bookmarks, courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/session';
import { canAccessCourse } from '@/lib/access';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function toggleBookmark(courseId: string) {
  const user = await requireUser();

  const courseRows = await db()
    .select({ id: courses.id, requiredPlanId: courses.requiredPlanId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  const course = courseRows[0];
  if (!course) throw new Error('講座が見つかりません');

  const hasAccess = await canAccessCourse(
    process.env.DB as unknown as D1Database,
    user.id,
    course
  );
  if (!hasAccess) throw new Error('この講座にはアクセスできません');

  const existing = await db()
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, user.id), eq(bookmarks.courseId, courseId)))
    .limit(1);

  if (existing[0]) {
    await db().delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    revalidatePath('/bookmarks');
    revalidatePath('/courses');
    return { bookmarked: false };
  }

  await db().insert(bookmarks).values({
    id: crypto.randomUUID(),
    userId: user.id,
    courseId,
    createdAt: new Date().toISOString(),
  });
  revalidatePath('/bookmarks');
  revalidatePath('/courses');
  return { bookmarked: true };
}
