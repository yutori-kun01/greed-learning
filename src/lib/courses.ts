import { getDb } from '@/db';
import { courses, lessons } from '@/db/schema';

/**
 * Course queries used by the admin screens. Kept out of `actions/courses.ts`
 * because every export of a `'use server'` file is a callable endpoint, and
 * this one returns unpublished courses.
 */
const db = () => getDb(process.env.DB as unknown as D1Database);

export async function getAllCourses() {
  try {
    const [allCourses, allLessons] = await Promise.all([
      db().select().from(courses).orderBy(courses.createdAt),
      db().select().from(lessons),
    ]);

    // The lessonCount column is not maintained when lessons are added or
    // removed, so the real count is derived here.
    return allCourses.map((course: typeof courses.$inferSelect) => ({
      ...course,
      lessonCount: allLessons.filter((l: typeof lessons.$inferSelect) => l.courseId === course.id).length,
    }));
  } catch {
    return [];
  }
}
