'use server';

import { getDb } from '@/db';
import { plans, user, courses } from '@/db/schema';
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
  try {
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
  } catch (err) {
    // The price and product already exist in Stripe at this point. Leaving
    // them behind means a purchasable price with no plan to grant access.
    await stripe.prices.update(stripePrice.id, { active: false }).catch(() => {});
    await stripe.products.update(product.id, { active: false }).catch(() => {});
    throw err;
  }

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

  const planResult = await db().select().from(plans).where(eq(plans.id, id)).limit(1);
  const plan = planResult[0];
  if (!plan) throw new Error('プランが見つかりません');

  // Deleting a plan a member is on would leave them paying Stripe with no
  // local grant, and deleting one that gates a course would silently open
  // that course to everyone (courses.requiredPlanId is ON DELETE SET NULL).
  const members = await db().select({ id: user.id }).from(user).where(eq(user.planId, id)).limit(1);
  if (members[0]) {
    throw new Error('このプランを契約している会員がいるため削除できません。「無効化」してください（既存会員の契約は維持されます）。');
  }

  const gatedCourses = await db()
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.requiredPlanId, id))
    .limit(1);
  if (gatedCourses[0]) {
    throw new Error('このプランを閲覧条件にしている講座があるため削除できません。先に講座側の設定を変更してください。');
  }

  // Archive in Stripe so the price can no longer be checked out.
  if (plan.stripePriceId || plan.stripeProductId) {
    const stripe = getStripe();
    if (plan.stripePriceId) {
      await stripe.prices.update(plan.stripePriceId, { active: false }).catch((err) => {
        console.error(`[plans] Could not archive price ${plan.stripePriceId}:`, err);
      });
    }
    if (plan.stripeProductId) {
      await stripe.products.update(plan.stripeProductId, { active: false }).catch((err) => {
        console.error(`[plans] Could not archive product ${plan.stripeProductId}:`, err);
      });
    }
  }

  await db().delete(plans).where(eq(plans.id, id));
  revalidatePath('/admin/plans');
  return { success: true };
}
