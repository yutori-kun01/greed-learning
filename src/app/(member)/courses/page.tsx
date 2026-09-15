import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAccessibleCourseIds, isCourseVisible } from '@/lib/access';
import { getMyBookmarkedCourseIds } from '@/actions/bookmarks';
import CoursesClientUI from './CoursesClientUI';
import { UNCATEGORIZED } from '@/lib/courseCategories';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;

  // 下書き・アーカイブは会員に出さない（管理者はプレビューできる）。
  const viewerRole = (session?.user as any)?.role;
  const allCourses = (await db().select().from(courses).orderBy(courses.createdAt))
    .filter((c: any) => isCourseVisible(c, viewerRole));
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
  const bookmarkedIds = await getMyBookmarkedCourseIds();

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
      // Derived from the lessons themselves: the denormalized lessonCount /
      // totalDuration columns are never updated when lessons change.
      lessons: courseLessons.length,
      minutes: Math.round(courseLessons.reduce((sum: number, l: any) => sum + (l.duration || 0), 0) / 60),
      cat: c.categoryId || UNCATEGORIZED,
      badge: c.badge || null,
      locked: !accessibleIds.has(c.id),
      bookmarked: bookmarkedIds.has(c.id),
    };
  });

  return <CoursesClientUI courses={formattedCourses} query={q || ''} />;
}
