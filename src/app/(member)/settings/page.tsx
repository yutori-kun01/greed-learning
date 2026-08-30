import React from 'react';
import MemberSettingsForm from './MemberSettingsForm';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/db';
import { user as userTable, plans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getActivePlans } from '@/actions/plans';

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

  return (
    <MemberSettingsForm
      user={me}
      plans={activePlans}
      currentPlan={currentPlan}
      subscriptionStatus={me?.subscriptionStatus || 'NONE'}
      initialTab={tab === 'plan' ? 'plan' : 'profile'}
    />
  );
}
