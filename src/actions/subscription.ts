'use server';

import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDb } from '@/db';
import { plans, user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { redirect } from 'next/navigation';

const db = () => getDb(process.env.DB as unknown as D1Database);

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-08-26.dahlia' as any,
  });
}

async function requireSession() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function createSubscriptionCheckoutSession(planId: string) {
  const session = await requireSession();

  const planResult = await db().select().from(plans).where(eq(plans.id, planId)).limit(1);
  const plan = planResult[0];
  if (!plan || !plan.isActive || !plan.stripePriceId) {
    throw new Error('無効なプランです');
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const userResult = await db().select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  const existingCustomerId = userResult[0]?.stripeCustomerId || undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: existingCustomerId,
    customer_email: existingCustomerId ? undefined : session.user.email,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    metadata: { userId: session.user.id, planId: plan.id },
    subscription_data: { metadata: { userId: session.user.id, planId: plan.id } },
    success_url: `${appUrl}/settings?tab=plan&subscribed=success`,
    cancel_url: `${appUrl}/settings?tab=plan&subscribed=cancelled`,
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  } else {
    throw new Error('チェックアウトセッションの作成に失敗しました');
  }
}

export async function createBillingPortalSession() {
  const session = await requireSession();
  const userResult = await db().select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  const customerId = userResult[0]?.stripeCustomerId;
  if (!customerId) {
    throw new Error('契約中のプランがありません');
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings?tab=plan`,
  });

  redirect(portalSession.url);
}

export async function getMyPlan() {
  const session = await requireSession();
  const userResult = await db().select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  const me = userResult[0];
  if (!me?.planId) return null;
  const planResult = await db().select().from(plans).where(eq(plans.id, me.planId)).limit(1);
  return planResult[0] || null;
}
