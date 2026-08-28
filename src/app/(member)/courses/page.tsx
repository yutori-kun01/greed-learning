import { getDb } from '@/db';
import { courses } from '@/db/schema';
import CoursesClientUI from './CoursesClientUI';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function CoursesPage() {
  const allCourses = await db().select().from(courses).orderBy(courses.createdAt);

  // Formatting for the client UI
  const formattedCourses = allCourses.map((c: any) => ({
    id: c.id,
    number: c.number,
    title: c.title,
    desc: c.description,
    progress: 0, // TODO: Fetch real progress from enrollments or lessonProgress
    lessons: c.lessonCount || 0,
    minutes: c.totalDuration || 0,
    cat: c.categoryId || 'strategy',
    badge: c.badge || null,
  }));

  return <CoursesClientUI courses={formattedCourses} />;
}
