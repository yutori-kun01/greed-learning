'use server';

import { requireUser } from '@/lib/session';
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

export async function createSubscriptionCheckoutSession(planId: string) {
  const me = await requireUser();

  const planResult = await db().select().from(plans).where(eq(plans.id, planId)).limit(1);
  const plan = planResult[0];
  if (!plan || !plan.isActive || !plan.stripePriceId) {
    throw new Error('無効なプランです');
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const userResult = await db().select().from(userTable).where(eq(userTable.id, me.id)).limit(1);
  const existingCustomerId = userResult[0]?.stripeCustomerId || undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: existingCustomerId,
    customer_email: existingCustomerId ? undefined : me.email,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    metadata: { userId: me.id, planId: plan.id },
    subscription_data: { metadata: { userId: me.id, planId: plan.id } },
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
  const me = await requireUser();
  const userResult = await db().select().from(userTable).where(eq(userTable.id, me.id)).limit(1);
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

