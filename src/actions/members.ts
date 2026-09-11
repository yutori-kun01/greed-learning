'use server';

import { getDb } from '@/db';
import { courses, enrollments, plans, user } from '@/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';

const db = () => getDb(process.env.DB as unknown as D1Database);

/**
 * Operator-side membership controls.
 *
 * canAccessCourse has always honoured an enrollments row as an override, but
 * nothing could create one — there was no way to hand a single member access
 * to a single course, which is how perks and one-off grants are normally run.
 */

export type MemberAccess = {
  courses: Array<{ id: string; number: string; title: string; requiredPlanId: string | null }>;
  enrolledCourseIds: string[];
  plans: Array<{ id: string; name: string }>;
  planId: string | null;
  subscriptionStatus: string;
  role: 'ADMIN' | 'MEMBER';
};

export async function getMemberAccess(userId: string): Promise<MemberAccess> {
  await requireAdmin();

  const [target] = await db()
    .select({
      planId: user.planId,
      subscriptionStatus: user.subscriptionStatus,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!target) throw new Error('ユーザーが見つかりません');

  const allCourses = await db()
    .select({
      id: courses.id,
      number: courses.number,
      title: courses.title,
      requiredPlanId: courses.requiredPlanId,
    })
    .from(courses)
    .orderBy(asc(courses.number));

  const enrolled = await db()
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  const allPlans = await db()
    .select({ id: plans.id, name: plans.name })
    .from(plans)
    .orderBy(asc(plans.sortOrder));

  return {
    courses: allCourses,
    enrolledCourseIds: enrolled.map((e: { courseId: string }) => e.courseId),
    plans: allPlans,
    planId: target.planId,
    subscriptionStatus: target.subscriptionStatus,
    role: target.role,
  };
}

export async function grantCourseAccess(userId: string, courseId: string) {
  await requireAdmin();

  const [course] = await db().select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) throw new Error('講座が見つかりません');

  const existing = await db()
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  if (existing[0]) return { success: true, alreadyGranted: true };

  await db().insert(enrollments).values({
    id: crypto.randomUUID(),
    userId,
    courseId,
    progress: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
  });

  revalidatePath('/admin/users');
  return { success: true, alreadyGranted: false };
}

export async function revokeCourseAccess(userId: string, courseId: string) {
  await requireAdmin();

  await db()
    .delete(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Sets the plan locally without touching Stripe — for comped accounts and
 * support fixes. A member who is actually paying keeps whatever the next
 * Stripe webhook says, so this is not a way to change what someone is billed.
 */
export async function setMemberPlan(userId: string, planId: string | null) {
  await requireAdmin();

  if (planId) {
    const [plan] = await db().select({ id: plans.id }).from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error('プランが見つかりません');
  }

  await db()
    .update(user)
    .set({
      planId,
      // Granting a plan by hand has to grant access too, or the plan shows on
      // the account while every gated course stays locked.
      subscriptionStatus: planId ? 'ACTIVE' : 'NONE',
    })
    .where(eq(user.id, userId));

  revalidatePath('/admin/users');
  return { success: true };
}

export async function setMemberRole(userId: string, role: 'ADMIN' | 'MEMBER') {
  const admin = await requireAdmin();

  if (userId === admin.id && role !== 'ADMIN') {
    throw new Error('自分自身の管理者権限は解除できません');
  }

  await db().update(user).set({ role }).where(eq(user.id, userId));
  revalidatePath('/admin/users');
  return { success: true };
}
