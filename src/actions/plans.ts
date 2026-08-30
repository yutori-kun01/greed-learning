'use server';

import { getDb } from '@/db';
import { plans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import Stripe from 'stripe';

const db = () => getDb(process.env.DB as unknown as D1Database);

async function requireAdmin() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-08-26.dahlia' as any,
  });
}

export async function getPlans() {
  try {
    return await db().select().from(plans).orderBy(plans.sortOrder);
  } catch (e) {
    return [];
  }
}

export async function getActivePlans() {
  const all = await getPlans();
  return all.filter((p: any) => p.isActive);
}

export async function createPlan(formData: FormData) {
  await requireAdmin();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseInt(formData.get('price') as string, 10) || 0;
  const interval = (formData.get('interval') as string) === 'year' ? 'year' : 'month';

  if (!name) throw new Error('プラン名は必須です');
  if (price <= 0) throw new Error('価格は1円以上で設定してください');

  const stripe = getStripe();
  const product = await stripe.products.create({ name, description: description || undefined });
  const stripePrice = await stripe.prices.create({
    product: product.id,
    currency: 'jpy',
    unit_amount: price,
    recurring: { interval },
  });

  const id = crypto.randomUUID();
  await db().insert(plans).values({
    id,
    name,
    description,
    price,
    interval,
    stripeProductId: product.id,
    stripePriceId: stripePrice.id,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  revalidatePath('/admin/plans');
  return { success: true, planId: id };
}

export async function togglePlanActive(id: string, isActive: boolean) {
  await requireAdmin();
  await db().update(plans).set({ isActive }).where(eq(plans.id, id));
  revalidatePath('/admin/plans');
  return { success: true };
}

export async function deletePlan(id: string) {
  await requireAdmin();
  await db().delete(plans).where(eq(plans.id, id));
  revalidatePath('/admin/plans');
  return { success: true };
}
