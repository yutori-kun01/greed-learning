import { getDb } from '@/db';
import { courses, lessons, lessonProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@/lib/session';
import { getAccessibleCourseIds } from '@/lib/access';
import { getCategories, getCourseTagMap, getMyBookmarkedCourseIds, getTags } from '@/lib/queries';
import { canPreviewUnpublished, getCourseJourneys, type CourseJourney } from '@/lib/journeyState';
import { describeRequirement } from '@/lib/journey';
import CoursesClientUI from './CoursesClientUI';

const db = () => getDb(process.env.DB as unknown as D1Database);

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ tag?: string | string[] }> }) {
  const { tag } = await searchParams;
  const userId = (await currentUser())?.id;

  // Members only ever see published courses; an admin previewing the member
  // view also sees drafts, marked as such. Everything below is independent,
  // so it is fetched together rather than one D1 round trip at a time.
  const [preview, courseRows, allLessons, userProgress, bookmarkedIds, journeys, tagMap, categories, tags] = await Promise.all([
    canPreviewUnpublished(),
    db().select().from(courses).orderBy(courses.createdAt),
    db().select().from(lessons),
    userId ? db().select().from(lessonProgress).where(eq(lessonProgress.userId, userId)) : Promise.resolve([]),
    getMyBookmarkedCourseIds(),
    userId ? getCourseJourneys(userId) : Promise.resolve(new Map<string, CourseJourney>()),
    getCourseTagMap(),
    getCategories(),
    getTags(),
  ]);
  const allCourses = courseRows.filter(
    (c: typeof courses.$inferSelect) => preview || c.status === 'PUBLISHED'
  );
  const completedLessonIds = new Set(
    userProgress.filter((p: any) => p.isCompleted).map((p: any) => p.lessonId)
  );

  const accessibleIds = userId
    ? await getAccessibleCourseIds(process.env.DB as unknown as D1Database, userId, allCourses)
    : new Set<string>();

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
      // Counted from the lessons themselves: the stored lessonCount and
      // totalDuration were never filled in for courses made before they were
      // kept up to date.
      lessons: courseLessons.length,
      minutes: Math.round(courseLessons.reduce((sum: number, l: any) => sum + (l.duration || 0), 0) / 60),
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

  const initialTags = (Array.isArray(tag) ? tag : tag ? [tag] : []).filter((id) => tags.some((t: { id: string }) => t.id === id));
  return <CoursesClientUI courses={formattedCourses} categories={categories} tags={tags} initialTags={initialTags} />;
}
