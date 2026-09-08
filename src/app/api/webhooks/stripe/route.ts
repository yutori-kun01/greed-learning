import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/db';
import { purchases } from '@/db/schema';
import { Resend } from 'resend';

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

        // メール送信 (Resend)
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          // ユーザーのメールアドレスと記事情報を取得（簡易）
          // Webhook session に customer_details.email があればそれを使う
          const customerEmail = session.customer_details?.email;
          if (customerEmail) {
            await resend.emails.send({
              from: 'Greed Learning <noreply@greed-learning.com>',
              to: customerEmail,
              subject: '【Greed Learning】ご購入ありがとうございます！',
              html: `
                <h2>ご購入ありがとうございます</h2>
                <p>記事/コンテンツの決済が正常に完了しました。</p>
                <p>以下のURLからログインし、コンテンツをお楽しみください。</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:10px 20px;background:#d9b45b;color:#101d31;text-decoration:none;border-radius:6px;font-weight:bold;">ダッシュボードへ</a></p>
              `,
            });
          }
        }
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
