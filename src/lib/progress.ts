import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { courses, lessonProgress, lessons } from '@/db/schema';

export type CourseStatus = 'completed' | 'in_progress' | 'not_started';

export type CourseProgress = {
  id: string;
  number: string;
  title: string;
  description: string | null;
  badge: string | null;
  thumbnailUrl: string | null;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  status: CourseStatus;
};

export type MemberProgress = {
  courses: CourseProgress[];
  inProgress: CourseProgress[];
  /** The course to nudge the member towards: least-progressed started course, else the first unstarted one. */
  nextCourse: CourseProgress | null;
  completedCourseCount: number;
  inProgressCourseCount: number;
  notStartedCourseCount: number;
  totalCourseCount: number;
  completedLessonCount: number;
  totalLessonCount: number;
  /** Share of all lessons in published courses that the member has completed. */
  overallPercent: number;
  /** Completed lessons per week for the last 4 weeks, oldest first. */
  weeklyCompletions: { label: string; count: number }[];
  completedThisMonth: number;
  completedLastMonth: number;
};

const EMPTY_PROGRESS: MemberProgress = {
  courses: [],
  inProgress: [],
  nextCourse: null,
  completedCourseCount: 0,
  inProgressCourseCount: 0,
  notStartedCourseCount: 0,
  totalCourseCount: 0,
  completedLessonCount: 0,
  totalLessonCount: 0,
  overallPercent: 0,
  weeklyCompletions: [1, 2, 3, 4].map((w) => ({ label: `W${w}`, count: 0 })),
  completedThisMonth: 0,
  completedLastMonth: 0,
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Real progress for one member, shared by the dashboard, the learning page and
 * the right rail. `cache()` keeps it to a single set of reads per request even
 * though the layout and the page both ask for it.
 */
export const getMemberProgress = cache(async (userId: string, now: Date = new Date()): Promise<MemberProgress> => {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);

    const [publishedCourses, allLessons, progressRows] = await Promise.all([
      db.select().from(courses).where(eq(courses.status, 'PUBLISHED')),
      db.select().from(lessons),
      db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    ]);

    const completedLessonIds = new Set(
      progressRows.filter((row: typeof lessonProgress.$inferSelect) => row.isCompleted).map((row: typeof lessonProgress.$inferSelect) => row.lessonId)
    );

    const lessonsByCourse = new Map<string, string[]>();
    for (const lesson of allLessons as (typeof lessons.$inferSelect)[]) {
      const list = lessonsByCourse.get(lesson.courseId);
      if (list) list.push(lesson.id);
      else lessonsByCourse.set(lesson.courseId, [lesson.id]);
    }

    const courseProgress: CourseProgress[] = (publishedCourses as (typeof courses.$inferSelect)[]).map((course) => {
      const lessonIds = lessonsByCourse.get(course.id) ?? [];
      const completed = lessonIds.filter((id) => completedLessonIds.has(id)).length;
      const percent = lessonIds.length > 0 ? Math.round((completed / lessonIds.length) * 100) : 0;
      const status: CourseStatus =
        lessonIds.length > 0 && completed === lessonIds.length
          ? 'completed'
          : completed > 0
            ? 'in_progress'
            : 'not_started';

      return {
        id: course.id,
        number: course.number,
        title: course.title,
        description: course.description,
        badge: course.badge,
        thumbnailUrl: course.thumbnailUrl,
        totalLessons: lessonIds.length,
        completedLessons: completed,
        percent,
        status,
      };
    });

    const totalLessonCount = courseProgress.reduce((sum, c) => sum + c.totalLessons, 0);
    const completedLessonCount = courseProgress.reduce((sum, c) => sum + c.completedLessons, 0);

    const inProgress = courseProgress
      .filter((c) => c.status === 'in_progress')
      .sort((a, b) => b.percent - a.percent);

    const nextCourse =
      [...inProgress].sort((a, b) => a.percent - b.percent)[0] ??
      courseProgress.find((c) => c.status === 'not_started') ??
      null;

    // Completion timestamps, for the weekly sparkline and the monthly totals.
    const completedAt = progressRows
      .filter((row: typeof lessonProgress.$inferSelect) => row.isCompleted && row.completedAt)
      .map((row: typeof lessonProgress.$inferSelect) => new Date(row.completedAt as string))
      .filter((date: Date) => !Number.isNaN(date.getTime()));

    const weekStart = startOfDay(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weeklyCompletions = [3, 2, 1, 0].map((weeksAgo, index) => {
      const from = new Date(weekStart);
      from.setDate(from.getDate() - weeksAgo * 7);
      const to = new Date(from);
      to.setDate(to.getDate() + 7);
      return {
        label: `W${index + 1}`,
        count: completedAt.filter((date: Date) => date >= from && date < to).length,
      };
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      courses: courseProgress,
      inProgress,
      nextCourse,
      completedCourseCount: courseProgress.filter((c) => c.status === 'completed').length,
      inProgressCourseCount: inProgress.length,
      notStartedCourseCount: courseProgress.filter((c) => c.status === 'not_started').length,
      totalCourseCount: courseProgress.length,
      completedLessonCount,
      totalLessonCount,
      overallPercent: totalLessonCount > 0 ? Math.round((completedLessonCount / totalLessonCount) * 100) : 0,
      weeklyCompletions,
      completedThisMonth: completedAt.filter((date: Date) => date >= monthStart).length,
      completedLastMonth: completedAt.filter((date: Date) => date >= lastMonthStart && date < monthStart).length,
    };
  } catch {
    return EMPTY_PROGRESS; // DB not ready — render empty states rather than failing the page.
  }
});
