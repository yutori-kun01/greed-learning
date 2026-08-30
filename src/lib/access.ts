import { getDb } from '@/db';
import { user, enrollments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

type CourseAccessInfo = { id: string; requiredPlanId: string | null };

/**
 * A course with no requiredPlanId is open to any signed-in member (current
 * default behavior). A course with requiredPlanId set is gated to members
 * on that exact plan (active subscription) or with an explicit enrollment
 * grant (admin override / one-off unlock).
 */
export async function canAccessCourse(
  d1: D1Database,
  userId: string,
  course: CourseAccessInfo
): Promise<boolean> {
  if (!course.requiredPlanId) return true;

  const db = getDb(d1);
  const userRow = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const me = userRow[0];
  if (me && me.subscriptionStatus === 'ACTIVE' && me.planId === course.requiredPlanId) {
    return true;
  }

  const enrollment = await db.select().from(enrollments).where(
    and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id))
  ).limit(1);
  return enrollment.length > 0;
}

/**
 * Batch version for lists: returns the subset of course ids the user can access.
 */
export async function getAccessibleCourseIds(
  d1: D1Database,
  userId: string,
  courses: CourseAccessInfo[]
): Promise<Set<string>> {
  const open = courses.filter(c => !c.requiredPlanId).map(c => c.id);
  const gated = courses.filter(c => c.requiredPlanId);

  if (gated.length === 0) return new Set(open);

  const db = getDb(d1);
  const userRow = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const me = userRow[0];

  const planUnlocked = gated
    .filter(c => me && me.subscriptionStatus === 'ACTIVE' && me.planId === c.requiredPlanId)
    .map(c => c.id);

  const gatedIds = gated.map(c => c.id);
  const enrolled = await db.select().from(enrollments).where(
    and(eq(enrollments.userId, userId), inArray(enrollments.courseId, gatedIds))
  );

  return new Set([...open, ...planUnlocked, ...enrolled.map((e: any) => e.courseId)]);
}
