'use server';

import { getDb } from '@/db';
import { bookmarks, courses } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

const db = () => getDb(process.env.DB as unknown as D1Database);

async function requireSession() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function getMyBookmarkedCourseIds() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return new Set<string>();

  const rows = await db().select().from(bookmarks).where(eq(bookmarks.userId, session.user.id));
  return new Set(rows.map((r: any) => r.courseId));
}

export async function getMyBookmarkedCourses() {
  const session = await requireSession();
  const rows = await db().select().from(bookmarks).where(eq(bookmarks.userId, session.user.id));
  const courseIds = rows.map((r: any) => r.courseId);
  if (courseIds.length === 0) return [];
  return await db().select().from(courses).where(inArray(courses.id, courseIds));
}

export async function toggleBookmark(courseId: string) {
  const session = await requireSession();

  const existing = await db().select().from(bookmarks).where(
    and(eq(bookmarks.userId, session.user.id), eq(bookmarks.courseId, courseId))
  ).limit(1);

  if (existing.length > 0) {
    await db().delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
    revalidatePath('/bookmarks');
    revalidatePath('/courses');
    return { bookmarked: false };
  }

  await db().insert(bookmarks).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    courseId,
    createdAt: new Date().toISOString(),
  });
  revalidatePath('/bookmarks');
  revalidatePath('/courses');
  return { bookmarked: true };
}
