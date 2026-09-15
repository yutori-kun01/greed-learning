import { asc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { courseResources } from '@/db/schema';

/**
 * Course resource (download) queries. Kept out of `actions/resources.ts` for
 * the same reason as the post queries: as Server Action exports they were
 * public endpoints that returned the download URLs of any course, bypassing
 * the plan gating applied by the pages.
 */
const db = () => getDb(process.env.DB as unknown as D1Database);

export async function getCourseResources(courseId: string) {
  try {
    return await db()
      .select()
      .from(courseResources)
      .where(eq(courseResources.courseId, courseId))
      .orderBy(asc(courseResources.sortOrder));
  } catch {
    return [];
  }
}

/** Callers must pass only course ids the viewer may access. */
export async function getResourcesForCourses(courseIds: string[]) {
  if (courseIds.length === 0) return [];
  try {
    return await db()
      .select()
      .from(courseResources)
      .where(inArray(courseResources.courseId, courseIds))
      .orderBy(asc(courseResources.sortOrder));
  } catch {
    return [];
  }
}
