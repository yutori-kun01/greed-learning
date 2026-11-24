import { getDb } from '@/db';
import { user, enrollments, memberPlans } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

type CourseAccessInfo = { id: string; requiredPlanId: string | null };
type Db = ReturnType<typeof getDb>;

/**
 * Every plan the member currently holds: the Stripe subscription's plan while
 * it is ACTIVE, plus each plan an operator granted by hand (memberPlans).
 */
async function getHeldPlanIds(db: Db, userId: string): Promise<Set<string>> {
  const [userRow, granted] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1),
    db.select({ planId: memberPlans.planId }).from(memberPlans).where(eq(memberPlans.userId, userId)),
  ]);
  const me = userRow[0];
  const held = new Set<string>(granted.map((g: { planId: string }) => g.planId));
  if (me && me.subscriptionStatus === 'ACTIVE' && me.planId) held.add(me.planId);
  return held;
}

/**
 * A course with no requiredPlanId is open to any signed-in member (current
 * default behavior). A course with requiredPlanId set is gated to members
 * holding that plan (active subscription or a manual grant) or with an
 * explicit enrollment grant (admin override / one-off unlock).
 */
export async function canAccessCourse(
  d1: D1Database,
  userId: string,
  course: CourseAccessInfo
): Promise<boolean> {
  if (!course.requiredPlanId) return true;

  const db = getDb(d1);
  const held = await getHeldPlanIds(db, userId);
  if (held.has(course.requiredPlanId)) return true;

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
  const held = await getHeldPlanIds(db, userId);

  const planUnlocked = gated
    .filter(c => held.has(c.requiredPlanId as string))
    .map(c => c.id);

  const gatedIds = gated.map(c => c.id);
  const enrolled = await db.select().from(enrollments).where(
    and(eq(enrollments.userId, userId), inArray(enrollments.courseId, gatedIds))
  );

  return new Set([...open, ...planUnlocked, ...enrolled.map((e: any) => e.courseId)]);
}
