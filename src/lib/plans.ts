import { getDb } from '@/db';
import { plans } from '@/db/schema';

/**
 * Plan queries. `getAllPlans` includes inactive plans and Stripe price ids, so
 * it must not be reachable as a Server Action endpoint — hence this module
 * rather than `actions/plans.ts`.
 */
const db = () => getDb(process.env.DB as unknown as D1Database);

export async function getAllPlans() {
  try {
    return await db().select().from(plans).orderBy(plans.sortOrder);
  } catch {
    return [];
  }
}

export async function getActivePlans() {
  const all = await getAllPlans();
  return all.filter((p: typeof plans.$inferSelect) => p.isActive);
}
