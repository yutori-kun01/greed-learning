import { getDb } from '@/db';
import { courses } from '@/db/schema';

export async function getCourses() {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    return await db.select().from(courses).orderBy(courses.createdAt);
  } catch (e) {
    return [];
  }
}
