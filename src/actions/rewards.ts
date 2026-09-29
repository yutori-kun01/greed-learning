'use server';

import { getDb } from '@/db';
import { rewardClaims, rewards, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/session';
import { parseThreshold } from '@/lib/journey';
import { parsePointValue } from '@/lib/points';
import { DEFAULT_SITE_NAME } from '@/lib/brand';
import { buildMemberRewards } from '@/lib/journeyState';

const db = () => getDb(process.env.DB as unknown as D1Database);

export type RewardResult = { success: true } | { success: false; error: string };

/** Only web links or site paths; never javascript: or data: URLs. */
function safeUrl(raw: FormDataEntryValue | null): string | null | { error: string } {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//'))) return value;
  return { error: 'リンクは https:// から始まるURL、または / から始まるサイト内のパスを入力してください' };
}

function fields(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'タイトルを入力してください' };
  const url = safeUrl(formData.get('url'));
  if (url && typeof url === 'object') return url;

  const requiredCompletedCourses = parseThreshold(formData.get('requiredCompletedCourses'));
  const requiredPoints = parseThreshold(formData.get('requiredPoints'));
  const sortOrder = Math.floor(Number(formData.get('sortOrder') ?? 0)) || 0;

  return {
    icon: String(formData.get('icon') ?? '').trim().slice(0, 8) || '🎁',
    title: title.slice(0, 80),
    description: String(formData.get('description') ?? '').trim() || null,
    content: String(formData.get('content') ?? '').trim() || null,
    url,
    requiredCompletedCourses,
    requiredPoints,
    isHidden: formData.get('isHidden') === 'on',
    isActive: formData.get('isActive') === 'on',
    sortOrder,
  };
}

function refresh() {
  revalidatePath('/admin/rewards');
  revalidatePath('/rewards');
}

export async function createReward(formData: FormData): Promise<RewardResult> {
  await requireAdmin();
  const values = fields(formData);
  if ('error' in values) return { success: false, error: values.error };
  await db().insert(rewards).values({ id: crypto.randomUUID(), ...values, createdAt: new Date().toISOString() });
  refresh();
  return { success: true };
}

export async function updateReward(id: string, formData: FormData): Promise<RewardResult> {
  await requireAdmin();
  const values = fields(formData);
  if ('error' in values) return { success: false, error: values.error };
  await db().update(rewards).set(values).where(eq(rewards.id, id));
  refresh();
  return { success: true };
}

export async function deleteReward(id: string): Promise<RewardResult> {
  await requireAdmin();
  await db().delete(rewards).where(eq(rewards.id, id));
  refresh();
  return { success: true };
}

export type ClaimResult =
  | { success: true; content: string | null; url: string | null }
  | { success: false; error: string };

/**
 * Takes a perk the member qualifies for. Points are not deducted — the
 * lifetime total only ever grows — so claiming just records that they took it
 * and reveals its content.
 */
export async function claimReward(rewardId: string): Promise<ClaimResult> {
  const me = await requireUser();

  const reward = (await buildMemberRewards(me.id)).find((r) => r.id === rewardId);
  if (!reward) return { success: false, error: '特典が見つかりません' };
  if (!reward.status.unlocked) return { success: false, error: 'まだ条件を満たしていません' };

  if (!reward.claimedAt) {
    try {
      await db().insert(rewardClaims).values({
        id: crypto.randomUUID(),
        userId: me.id,
        rewardId,
        claimedAt: new Date().toISOString(),
      });
    } catch {
      // Unique index: a double click already claimed it.
    }
  }

  const rows = await db()
    .select({ content: rewards.content, url: rewards.url })
    .from(rewards)
    .where(eq(rewards.id, rewardId))
    .limit(1);

  revalidatePath('/rewards');
  return { success: true, content: rows[0]?.content ?? null, url: rows[0]?.url ?? null };
}

const POINT_FIELDS = ['pointsDailyLogin', 'pointsLessonComplete', 'pointsCourseComplete', 'pointsStreakMilestone'] as const;

/**
 * Points per action. Changes apply to awards from now on; points already
 * earned stay as they are.
 */
export async function updatePointSettings(formData: FormData): Promise<RewardResult> {
  await requireAdmin();

  const values: Partial<Record<(typeof POINT_FIELDS)[number], number | null>> = {};
  for (const field of POINT_FIELDS) {
    const parsed = parsePointValue(formData.get(field));
    if (parsed !== null && typeof parsed === 'object') return { success: false, error: parsed.error };
    values[field] = parsed;
  }

  const updatedAt = new Date().toISOString();
  // The row may not exist yet on a fresh site. Its siteName column default
  // predates the rebrand, so a first insert has to name the site itself.
  await db()
    .insert(siteSettings)
    .values({ id: '1', siteName: DEFAULT_SITE_NAME, ...values, updatedAt })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...values, updatedAt } });

  revalidatePath('/admin/rewards');
  revalidatePath('/rewards');
  return { success: true };
}
