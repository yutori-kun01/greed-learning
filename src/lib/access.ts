import { getDb } from '@/db';
import { user, enrollments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSiteSettings } from '@/lib/siteSettings';

type CourseAccessInfo = { id: string; requiredPlanId: string | null };

/**
 * A course with requiredPlanId set is gated to members on that exact plan
 * (active subscription) or with an explicit enrollment grant.
 *
 * A course without one follows the site-wide policy: open to any signed-in
 * member by default, or — when the operator turns on 「サブスク必須」 in the
 * site settings — only to members with an active subscription.
 */
export async function canAccessCourse(
  d1: D1Database,
  userId: string,
  course: CourseAccessInfo
): Promise<boolean> {
  const db = getDb(d1);

  if (!course.requiredPlanId) {
    if (!(await isSubscriptionRequired())) return true;
    const rows = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (rows[0]?.subscriptionStatus === 'ACTIVE') return true;
    // 未加入でも、個別に付与された受講権があれば見られる。
    const grant = await db.select().from(enrollments).where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id))
    ).limit(1);
    return grant.length > 0;
  }

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
  const db = getDb(d1);
  const subscriptionRequired = await isSubscriptionRequired();

  const ungated = courses.filter(c => !c.requiredPlanId);
  const gated = courses.filter(c => c.requiredPlanId);

  const userRow = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const me = userRow[0];
  const subscribed = me?.subscriptionStatus === 'ACTIVE';

  const open = subscriptionRequired && !subscribed ? [] : ungated.map(c => c.id);

  const planUnlocked = gated
    .filter(c => subscribed && me?.planId === c.requiredPlanId)
    .map(c => c.id);

  // 個別付与は、プラン制限のある講座と、サブスク必須時の未加入者の両方で効く。
  const needsGrantCheck = [
    ...gated.map(c => c.id),
    ...(subscriptionRequired && !subscribed ? ungated.map(c => c.id) : []),
  ];

  const enrolled = needsGrantCheck.length > 0
    ? await db.select().from(enrollments).where(
        and(eq(enrollments.userId, userId), inArray(enrollments.courseId, needsGrantCheck))
      )
    : [];

  return new Set([...open, ...planUnlocked, ...enrolled.map((e: typeof enrollments.$inferSelect) => e.courseId)]);
}

/** サイト設定「講座の閲覧にサブスクリプションを必須にする」。 */
async function isSubscriptionRequired(): Promise<boolean> {
  const settings = await getSiteSettings();
  return settings?.requireSubscription ?? false;
}

type CourseVisibilityInfo = { status: string };

/**
 * Draft and archived courses are catalogue-invisible: they must not appear in
 * the member course list, and their detail and lesson pages must 404.
 * Admins still see them so they can preview before publishing.
 */
export function isCourseVisible(course: CourseVisibilityInfo, viewerRole?: string | null): boolean {
  return course.status === 'PUBLISHED' || viewerRole === 'ADMIN';
}
