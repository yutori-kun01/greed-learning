import 'server-only';

import { cache } from 'react';
import { getDb } from '@/db';
import { courses, lessonProgress, lessons } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getAccessibleCourseIds } from '@/lib/access';

export type CourseProgress = {
  id: string;
  title: string;
  badge: string | null;
  description: string | null;
  total: number;
  done: number;
  percent: number;
};

export type CourseProgressOverview = {
  courses: CourseProgress[];
  inProgress: CourseProgress[];
  notStarted: CourseProgress[];
  completed: CourseProgress[];
  /** Completed lessons over all lessons in the courses the member can open. */
  overallPercent: number;
};

/**
 * Per-course completion for every published course the member can open.
 *
 * The dashboard, the right rail and anything else in the member layout ask
 * for this on the same request, so it is memoized per request.
 */
export const getCourseProgressOverview = cache(
  async (userId: string): Promise<CourseProgressOverview> => {
    const d1 = process.env.DB as unknown as D1Database;
    const db = getDb(d1);

    const published = await db
      .select({
        id: courses.id,
        title: courses.title,
        badge: courses.badge,
        description: courses.description,
        requiredPlanId: courses.requiredPlanId,
      })
      .from(courses)
      .where(eq(courses.status, 'PUBLISHED'))
      .orderBy(courses.createdAt);

    const accessibleIds = await getAccessibleCourseIds(d1, userId, published);
    const visible = published.filter((c: { id: string }) => accessibleIds.has(c.id));

    const lessonRows: Array<{ id: string; courseId: string }> = visible.length
      ? await db
          .select({ id: lessons.id, courseId: lessons.courseId })
          .from(lessons)
          .where(inArray(lessons.courseId, visible.map((c: { id: string }) => c.id)))
      : [];

    const completedRows = await db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.isCompleted, true)));
    const completedIds = new Set(completedRows.map((r: { lessonId: string }) => r.lessonId));

    const counts = new Map<string, { total: number; done: number }>();
    for (const lesson of lessonRows) {
      const entry = counts.get(lesson.courseId) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (completedIds.has(lesson.id)) entry.done += 1;
      counts.set(lesson.courseId, entry);
    }

    const withProgress: CourseProgress[] = visible.map(
      (course: { id: string; title: string; badge: string | null; description: string | null }) => {
        const c = counts.get(course.id) ?? { total: 0, done: 0 };
        return {
          id: course.id,
          title: course.title,
          badge: course.badge,
          description: course.description,
          ...c,
          percent: c.total > 0 ? Math.round((c.done / c.total) * 100) : 0,
        };
      }
    );

    const totalLessons = withProgress.reduce((sum, c) => sum + c.total, 0);
    const doneLessons = withProgress.reduce((sum, c) => sum + c.done, 0);

    return {
      courses: withProgress,
      inProgress: withProgress
        .filter((c) => c.done > 0 && c.done < c.total)
        .sort((a, b) => b.percent - a.percent),
      notStarted: withProgress.filter((c) => c.done === 0),
      completed: withProgress.filter((c) => c.total > 0 && c.done === c.total),
      overallPercent: totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0,
    };
  }
);
