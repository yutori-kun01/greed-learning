'use server';

import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDb } from '@/db';
import { blogPosts, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(postId: string) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  const db = getDb(process.env.DB as unknown as D1Database);
  
  // Verify post exists and is PAID
  const postResult = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
  const post = postResult[0];

  if (!post || post.status !== 'PAID') {
    throw new Error('Invalid post');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-08-26.dahlia' as any,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Create Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: session.user.email, // Use logged in user's email
    metadata: {
      userId: session.user.id,
      postId: post.id,
    },
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: post.title,
            description: 'N8N MARKETING 記事コンテンツ',
          },
          unit_amount: post.price || 1000,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/posts/${post.slug}?purchase=success`,
    cancel_url: `${appUrl}/posts/${post.slug}?purchase=cancelled`,
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  } else {
    throw new Error('Failed to create checkout session');
  }
}
