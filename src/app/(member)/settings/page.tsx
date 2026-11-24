import React from 'react';
import MemberSettingsForm from './MemberSettingsForm';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/db';
import { user as userTable, plans, memberPlans } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getActivePlans } from '@/lib/queries';

export default async function MemberSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) return null;

  const db = getDb(process.env.DB as unknown as D1Database);
  const userResult = await db.select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  const me = userResult[0];

  const activePlans = await getActivePlans();
  let currentPlan = null;
  if (me?.planId) {
    const planResult = await db.select().from(plans).where(eq(plans.id, me.planId)).limit(1);
    currentPlan = planResult[0] || null;
  }

  const grantedPlans = await db
    .select({ id: plans.id, name: plans.name })
    .from(memberPlans)
    .innerJoin(plans, eq(memberPlans.planId, plans.id))
    .where(eq(memberPlans.userId, session.user.id))
    .orderBy(asc(plans.sortOrder));

  return (
    <MemberSettingsForm
      user={me}
      plans={activePlans}
      currentPlan={currentPlan}
      grantedPlans={grantedPlans}
      subscriptionStatus={me?.subscriptionStatus || 'NONE'}
      initialTab={tab === 'plan' ? 'plan' : 'profile'}
    />
  );
}
