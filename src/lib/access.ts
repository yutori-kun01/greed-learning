import { getDb } from '@/db';
import { user, enrollments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { grantedProductIds, parseProductIds } from '@/lib/akinai';

// akinaiProductIds is required so every caller selecting a subset of course
// columns has to include it; leaving it out would silently open sold courses.
export type CourseAccessInfo = { id: string; requiredPlanId: string | null; akinaiProductIds: string | null };

// Anything stored in akinaiProductIds gates the course, even if it no longer
// parses: a corrupted list keeps the course locked rather than opening it.
const isGated = (c: CourseAccessInfo) =>
  !!c.requiredPlanId || (!!c.akinaiProductIds?.trim() && c.akinaiProductIds.trim() !== '[]');

/**
 * A course with no requiredPlanId and no Akinai hub products is open to any
 * signed-in member (current default behavior). Otherwise it is gated to
 * members on that exact plan (active subscription), with an explicit
 * enrollment grant (admin override / one-off unlock), or who bought one of its
 * Akinai hub products with the email they sign in with.
 */
export async function canAccessCourse(
  d1: D1Database,
  userId: string,
  course: CourseAccessInfo
): Promise<boolean> {
  if (!isGated(course)) return true;

  const db = getDb(d1);
  const userRow = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const me = userRow[0];
  if (course.requiredPlanId && me && me.subscriptionStatus === 'ACTIVE' && me.planId === course.requiredPlanId) {
    return true;
  }

  const enrollment = await db.select().from(enrollments).where(
    and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id))
  ).limit(1);
  if (enrollment.length > 0) return true;

  const products = parseProductIds(course.akinaiProductIds);
  if (products.length === 0 || !me?.email) return false;
  return (await grantedProductIds(d1, me.email, products)).size > 0;
}

/**
 * Batch version for lists: returns the subset of course ids the user can access.
 */
export async function getAccessibleCourseIds(
  d1: D1Database,
  userId: string,
  courses: CourseAccessInfo[]
): Promise<Set<string>> {
  const open = courses.filter(c => !isGated(c)).map(c => c.id);
  const gated = courses.filter(isGated);

  if (gated.length === 0) return new Set(open);

  const db = getDb(d1);
  const userRow = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const me = userRow[0];

  const planUnlocked = gated
    .filter(c => c.requiredPlanId && me && me.subscriptionStatus === 'ACTIVE' && me.planId === c.requiredPlanId)
    .map(c => c.id);

  const gatedIds = gated.map(c => c.id);
  const enrolled = await db.select().from(enrollments).where(
    and(eq(enrollments.userId, userId), inArray(enrollments.courseId, gatedIds))
  );

  const sold = gated.filter(c => parseProductIds(c.akinaiProductIds).length > 0);
  const paid = sold.length > 0 && me?.email
    ? await grantedProductIds(d1, me.email, [...new Set(sold.flatMap(c => parseProductIds(c.akinaiProductIds)))])
    : new Set<string>();
  const purchased = sold.filter(c => parseProductIds(c.akinaiProductIds).some(p => paid.has(p))).map(c => c.id);

  return new Set([...open, ...planUnlocked, ...enrolled.map((e: any) => e.courseId), ...purchased]);
}
