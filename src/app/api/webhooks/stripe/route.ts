import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/db';
import { purchases, user, plans, webhookEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mapSubscriptionStatus } from '@/lib/subscriptionStatus';

type Db = ReturnType<typeof getDb>;

function idOf(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.id;
}

/**
 * Stripe does not guarantee event ordering, so a subscription event can arrive
 * before the checkout.session.completed that would have linked the
 * subscription to a user. Matching on stripeSubscriptionId alone therefore
 * updates zero rows and loses the grant silently. Resolve through the metadata
 * we set at Checkout first, then the two ids, and treat "no match" as an error
 * rather than a no-op.
 */
async function resolveUserId(db: Db, subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata?.userId;
  if (fromMetadata) {
    const rows = await db.select({ id: user.id }).from(user).where(eq(user.id, fromMetadata)).limit(1);
    if (rows[0]) return rows[0].id;
  }

  const bySubscription = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.stripeSubscriptionId, subscription.id))
    .limit(1);
  if (bySubscription[0]) return bySubscription[0].id;

  const customerId = idOf(subscription.customer);
  if (customerId) {
    const byCustomer = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.stripeCustomerId, customerId))
      .limit(1);
    if (byCustomer[0]) return byCustomer[0].id;
  }

  return null;
}

async function syncSubscription(db: Db, subscription: Stripe.Subscription) {
  const userId = await resolveUserId(db, subscription);
  if (!userId) {
    // Throwing makes Stripe retry and surfaces the failure in the dashboard.
    // A paid subscription with no local grant must never be silently dropped.
    throw new Error(
      `No user matches subscription ${subscription.id} (customer ${idOf(subscription.customer)}). Subscription is paid but access was not granted.`
    );
  }

  const priceId = subscription.items.data[0]?.price.id;
  let planId: string | null = null;
  if (priceId) {
    const planResult = await db.select().from(plans).where(eq(plans.stripePriceId, priceId)).limit(1);
    planId = planResult[0]?.id || null;
    if (!planId) {
      console.error(`[stripe] Subscription ${subscription.id} uses price ${priceId}, which matches no plan. Access will not reflect a plan.`);
    }
  }

  const periodEndSeconds = subscription.items.data[0]?.current_period_end;

  await db
    .update(user)
    .set({
      planId,
      subscriptionStatus: mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
      // Written here as well as at checkout, so a subscription created out of
      // order (or in the Stripe dashboard) still ends up linked.
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: idOf(subscription.customer) ?? undefined,
    })
    .where(eq(user.id, userId));
}

async function handleEvent(db: Db, stripe: Stripe, event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription') {
        const subscriptionId = idOf(session.subscription);
        if (!subscriptionId) {
          throw new Error(`Checkout session ${session.id} completed in subscription mode with no subscription id.`);
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(db, subscription);
        return;
      }

      const userId = session.metadata?.userId;
      const postId = session.metadata?.postId;
      if (!userId || !postId) {
        throw new Error(`Checkout session ${session.id} is missing userId/postId metadata; cannot grant access.`);
      }

      const existing = await db
        .select({ id: purchases.id })
        .from(purchases)
        .where(eq(purchases.stripeSessionId, session.id))
        .limit(1);
      if (existing[0]) return;

      await db.insert(purchases).values({
        id: crypto.randomUUID(),
        userId,
        postId,
        stripeSessionId: session.id,
        amount: session.amount_total || 0,
        purchasedAt: new Date().toISOString(),
      });
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(db, event.data.object as Stripe.Subscription);
      return;

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserId(db, subscription);
      if (!userId) {
        // Nothing to revoke. Unlike the grant path this is safe to accept.
        console.warn(`[stripe] Cancellation for unknown subscription ${subscription.id}; nothing to revoke.`);
        return;
      }
      await db.update(user).set({ subscriptionStatus: 'CANCELED' }).where(eq(user.id, userId));
      return;
    }

    // Renewals and failed renewals change access but arrive as invoice events,
    // so without these a lapsed card kept its access until cancellation.
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
      if (!subscriptionId) return; // One-off invoice; nothing subscription-shaped to sync.

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(db, subscription);
      return;
    }

    default:
      return;
  }
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
    console.error('⚠️ Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  const db = getDb(process.env.DB as unknown as D1Database);

  // Claim the event id before handling it. A concurrent delivery loses the
  // insert on the primary key and gets a 500, and its retry then sees the row.
  try {
    const already = await db
      .select({ id: webhookEvents.id })
      .from(webhookEvents)
      .where(eq(webhookEvents.id, event.id))
      .limit(1);
    if (already[0]) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await db.insert(webhookEvents).values({
      id: event.id,
      type: event.type,
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[stripe] Could not record event ${event.id}:`, err);
    return NextResponse.json({ error: 'Webhook bookkeeping failed' }, { status: 500 });
  }

  try {
    await handleEvent(db, stripe, event);
  } catch (err) {
    // Release the claim so Stripe's redelivery gets a real second attempt
    // rather than being dismissed as a duplicate.
    try {
      await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id));
    } catch (cleanupErr) {
      console.error(`[stripe] Could not release event claim ${event.id}:`, cleanupErr);
    }
    console.error(`[stripe] Failed to handle ${event.type} (${event.id}):`, err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
