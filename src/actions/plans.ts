'use server';

import { getDb } from '@/db';
import { plans, user, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import Stripe from 'stripe';

const db = () => getDb(process.env.DB as unknown as D1Database);

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-08-26.dahlia' as any,
  });
}

export type CreatePlanResult = { success: true; planId: string } | { success: false; error: string };

/**
 * Two kinds of plan:
 * - manual: no Stripe at all. The admin assigns it to members by hand (会員
 *   管理), which is how courses are opened to chosen members without payments.
 * - stripe: a recurring Stripe price that members can subscribe to themselves.
 *
 * Validation failures are returned, not thrown — Next.js hides thrown
 * messages in production.
 */
export async function createPlan(formData: FormData): Promise<CreatePlanResult> {
  await requireAdmin();

  const name = ((formData.get('name') as string) || '').trim();
  const description = (formData.get('description') as string) || null;
  const billing = formData.get('billing') === 'stripe' ? 'stripe' : 'manual';
  const price = parseInt(formData.get('price') as string, 10) || 0;
  const interval = (formData.get('interval') as string) === 'year' ? 'year' : 'month';

  if (!name) return { success: false, error: 'プラン名は必須です' };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  if (billing === 'manual') {
    await db().insert(plans).values({
      id, name, description, price: 0, interval, isActive: true, createdAt,
    });
    revalidatePath('/admin/plans');
    return { success: true, planId: id };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { success: false, error: 'Stripeが未設定のため販売プランは作成できません。「手動付与」を選んでください' };
  }
  if (price <= 0) return { success: false, error: '販売プランの価格は1円以上で設定してください' };

  const stripe = getStripe();
  const product = await stripe.products.create({ name, description: description || undefined });
  const stripePrice = await stripe.prices.create({
    product: product.id,
    currency: 'jpy',
    unit_amount: price,
    recurring: { interval },
  });

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
      createdAt,
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
