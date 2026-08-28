import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/db';
import { purchases } from '@/db/schema';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Retrieve metadata
    const userId = session.metadata?.userId;
    const postId = session.metadata?.postId;

    if (userId && postId) {
      const db = getDb(process.env.DB as unknown as D1Database);
      
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
          console.error('Database insert error:', insertError);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
