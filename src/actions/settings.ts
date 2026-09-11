'use server';

import { getDb } from '@/db';
import { user, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/session';

// Helper for DB instance
const db = () => getDb(process.env.DB as unknown as D1Database);

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();

  const siteName = formData.get('siteName') as string;
  const accentColor = formData.get('accentColor') as string;
  const bgPattern = formData.get('bgPattern') as string;
  const logoUrl = (formData.get('logoUrl') as string) || null;

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

export async function updateUserProfile(formData: FormData) {
  const me = await requireUser();

  const name = formData.get('name') as string;
  const noteId = formData.get('noteId') as string;
  const xId = formData.get('xId') as string;

  await db().update(user)
    .set({ name, noteId, xId })
    .where(eq(user.id, me.id));

  revalidatePath('/settings');
  return { success: true };
}

