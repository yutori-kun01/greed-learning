'use server';

import { getDb } from '@/db';
import { user, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/session';
import { normalizeImageUrl } from '@/lib/imageUrl';

// Next.js replaces the message of anything thrown from a Server Action with a
// generic one in production, so input the user can fix is reported as a
// value, and throwing is kept for authorization failures only.
export type SaveResult = { success: true } | { success: false; error: string };

function invalid(error: unknown): SaveResult {
  return { success: false, error: (error as Error).message };
}

// Helper for DB instance
const db = () => getDb(process.env.DB as unknown as D1Database);

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DEFAULT_ACCENT = '#d9b45b';

function normalizeAccentColor(value: string | null): string {
  const candidate = (value || '').trim();
  if (!candidate) return DEFAULT_ACCENT;
  if (HEX_COLOR.test(candidate)) return candidate.toLowerCase();
  throw new Error('アクセントカラーは #rrggbb 形式で指定してください');
}

export async function updateSiteSettings(formData: FormData): Promise<SaveResult> {
  await requireAdmin();

  const siteName = formData.get('siteName') as string;

  // Rendered into a CSS custom property, so anything but a literal colour
  // would let an admin inject arbitrary CSS onto every page of the site.
  let accentColor: string;
  let logoUrl: string | null;
  try {
    accentColor = normalizeAccentColor(formData.get('accentColor') as string);
    logoUrl = normalizeImageUrl(formData.get('logoUrl'));
  } catch (error) {
    return invalid(error);
  }
  const bgPattern = formData.get('bgPattern') as string;

  const operatorName = (formData.get('operatorName') as string) || null;
  const operatorRepresentative = (formData.get('operatorRepresentative') as string) || null;
  const operatorAddress = (formData.get('operatorAddress') as string) || null;
  const operatorPhone = (formData.get('operatorPhone') as string) || null;
  const operatorEmail = (formData.get('operatorEmail') as string) || null;
  const tokushohoExtra = (formData.get('tokushohoExtra') as string) || null;
  const termsContent = (formData.get('termsContent') as string) || null;
  const privacyContent = (formData.get('privacyContent') as string) || null;

  const values = {
    siteName,
    accentColor,
    bgPattern,
    logoUrl,
    operatorName,
    operatorRepresentative,
    operatorAddress,
    operatorPhone,
    operatorEmail,
    tokushohoExtra,
    termsContent,
    privacyContent,
    updatedAt: new Date().toISOString(),
  };

  await db().insert(siteSettings).values({ id: '1', ...values }).onConflictDoUpdate({
    target: siteSettings.id,
    set: values,
  });

  revalidatePath('/', 'layout');
  revalidatePath('/legal/tokushoho');
  revalidatePath('/legal/terms');
  revalidatePath('/legal/privacy');
  return { success: true };
}

export async function updateUserProfile(formData: FormData): Promise<SaveResult> {
  const me = await requireUser();

  const name = ((formData.get('name') as string) || '').trim();
  if (!name) return { success: false, error: '表示名を入力してください' };
  const noteId = formData.get('noteId') as string;
  const xId = formData.get('xId') as string;
  let image: string | null;
  try {
    image = normalizeImageUrl(formData.get('image'));
  } catch (error) {
    return invalid(error);
  }

  await db().update(user)
    .set({ name, noteId, xId, image })
    .where(eq(user.id, me.id));

  revalidatePath('/settings');
  return { success: true };
}

