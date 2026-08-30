import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/db';
import { purchases, user, plans } from '@/db/schema';
import { eq } from 'drizzle-orm';

function mapSubscriptionStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' {
  if (status === 'active' || status === 'trialing') return 'ACTIVE';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'PAST_DUE';
  return 'CANCELED';
}

async function syncSubscription(db: ReturnType<typeof getDb>, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  let planId: string | null = null;
  if (priceId) {
    const planResult = await db.select().from(plans).where(eq(plans.stripePriceId, priceId)).limit(1);
    planId = planResult[0]?.id || null;
  }

  const status = mapSubscriptionStatus(subscription.status);
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null;

  await db.update(user)
    .set({
      planId,
      subscriptionStatus: status,
      currentPeriodEnd,
    })
    .where(eq(user.stripeSubscriptionId, subscription.id));
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-08-26.dahlia' as any,
  });

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Edge compatibility: use text() and constructEventAsync
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed.`, err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const db = getDb(process.env.DB as unknown as D1Database);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription') {
        const userId = session.metadata?.userId;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (userId && customerId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await db.update(user)
            .set({ stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId })
            .where(eq(user.id, userId));
          await syncSubscription(db, subscription);
          console.log(`✅ Subscription ${subscriptionId} activated for user ${userId}`);
        }
      } else {
        // One-off payment (e.g. a PAID blog post)
        const userId = session.metadata?.userId;
        const postId = session.metadata?.postId;

        if (userId && postId) {
          try {
            await db.insert(purchases).values({
              id: crypto.randomUUID(),
              userId,
              postId,
              stripeSessionId: session.id,
              amount: session.amount_total || 0,
              purchasedAt: new Date().toISOString(),
            });
            console.log(`✅ Granted access to post ${postId} for user ${userId}`);
          } catch (insertError: any) {
            // If UNIQUE constraint fails, it means we already processed this session
            if (insertError.message?.includes('UNIQUE constraint failed')) {
              console.log(`ℹ️ Session ${session.id} already processed.`);
            } else {
              throw insertError;
            }
          }
        }
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      await syncSubscription(db, event.data.object as Stripe.Subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await db.update(user)
        .set({ subscriptionStatus: 'CANCELED' })
        .where(eq(user.stripeSubscriptionId, subscription.id));
    }
  } catch (err) {
    console.error('Webhook handling error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
