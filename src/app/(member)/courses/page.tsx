import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAccessibleCourseIds } from '@/lib/access';
import { getCategories, getCourseTagMap, getMyBookmarkedCourseIds, getTags } from '@/lib/queries';
import { canPreviewUnpublished, getCourseJourneys, type CourseJourney } from '@/lib/journeyState';
import { describeRequirement } from '@/lib/journey';
import CoursesClientUI from './CoursesClientUI';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ tag?: string | string[] }> }) {
  const { tag } = await searchParams;
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;

  // Members only ever see published courses; an admin previewing the member
  // view also sees drafts, marked as such.
  const preview = await canPreviewUnpublished();
  const allCourses = (await db().select().from(courses).orderBy(courses.createdAt)).filter(
    (c: typeof courses.$inferSelect) => preview || c.status === 'PUBLISHED'
  );
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
  const journeys = userId ? await getCourseJourneys(userId) : new Map<string, CourseJourney>();
  const tagMap = await getCourseTagMap();

  // Formatting for the client UI. A hidden course the member has not opened
  // yet is left out entirely, so not even its title reaches the browser.
  type Course = typeof courses.$inferSelect;
  const formattedCourses = allCourses.filter((c: Course) => !journeys.get(c.id)?.hidden).map((c: Course) => {
    const journey = journeys.get(c.id);
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
      cat: c.categoryId || '',
      badge: c.status === 'PUBLISHED' ? c.badge || null : c.status === 'DRAFT' ? '下書き' : 'アーカイブ',
      thumbnailUrl: c.thumbnailUrl || null,
      locked: !accessibleIds.has(c.id),
      bookmarked: bookmarkedIds.has(c.id),
      tagIds: tagMap.get(c.id) ?? [],
      journeyLocked: journey ? !journey.unlocked : false,
      // Met requirements are listed too (struck through) so the member can
      // see how far along they are.
      requirements: journey && !journey.unlocked
        ? journey.requirements.map((r) => ({ text: describeRequirement(r), met: r.met }))
        : [],
      // Opened through the journey (and, if it was hidden, now revealed).
      journeyUnlocked: journey ? journey.unlocked && journey.requirements.length > 0 : false,
      secret: Boolean(c.isHidden && journey?.unlocked && journey.requirements.length > 0),
    };
  });

  const [categories, tags] = await Promise.all([getCategories(), getTags()]);
  const initialTags = (Array.isArray(tag) ? tag : tag ? [tag] : []).filter((id) => tags.some((t: { id: string }) => t.id === id));
  return <CoursesClientUI courses={formattedCourses} categories={categories} tags={tags} initialTags={initialTags} />;
}
