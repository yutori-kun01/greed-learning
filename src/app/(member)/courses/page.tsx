import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAccessibleCourseIds } from '@/lib/access';
import CoursesClientUI from './CoursesClientUI';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function CoursesPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;

  const allCourses = await db().select().from(courses).orderBy(courses.createdAt);
  const allLessons = await db().select().from(lessons);
  const userProgress = userId
    ? await db().select().from(lessonProgress).where(eq(lessonProgress.userId, userId))
    : [];
  const completedLessonIds = new Set(
    userProgress.filter((p: any) => p.isCompleted).map((p: any) => p.lessonId)
  );

  const accessibleIds = userId
    ? await getAccessibleCourseIds(process.env.DB as unknown as D1Database, userId, allCourses)
    : new Set<string>();

  // Formatting for the client UI
  const formattedCourses = allCourses.map((c: any) => {
    const courseLessons = allLessons.filter((l: any) => l.courseId === c.id);
    const completedCount = courseLessons.filter((l: any) => completedLessonIds.has(l.id)).length;
    const progress = courseLessons.length > 0 ? Math.round((completedCount / courseLessons.length) * 100) : 0;

    return {
      id: c.id,
      number: c.number,
      title: c.title,
      desc: c.description,
      progress,
      lessons: c.lessonCount || 0,
      minutes: c.totalDuration || 0,
      cat: c.categoryId || 'strategy',
      badge: c.badge || null,
      locked: !accessibleIds.has(c.id),
    };
  });

  return <CoursesClientUI courses={formattedCourses} />;
}
