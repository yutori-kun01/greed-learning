'use server';

import { getDb } from '@/db';
import { user, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { sanitizeAccentColor, sanitizeBgPattern, DEFAULT_SITE_NAME } from '@/lib/siteSettings.shared';
import { sanitizeImageUrl } from '@/lib/uploads';

// Helper for DB instance
const db = () => getDb(process.env.DB as unknown as D1Database);

export async function updateSiteSettings(formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const siteName = ((formData.get('siteName') as string) || '').trim() || DEFAULT_SITE_NAME;
  // Reject anything that is not a plain hex colour — the value is inlined into
  // a <style> tag by the root layout.
  const accentColor = sanitizeAccentColor(formData.get('accentColor') as string) || '';
  const bgPattern = sanitizeBgPattern(formData.get('bgPattern') as string);
  const logoUrl = sanitizeImageUrl(formData.get('logoUrl') as string);

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
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  const name = ((formData.get('name') as string) || '').trim();
  const noteId = formData.get('noteId') as string;
  const xId = formData.get('xId') as string;
  const image = sanitizeImageUrl(formData.get('image') as string);

  if (!name) {
    throw new Error('表示名を入力してください');
  }

  await db().update(user)
    .set({ name, noteId, xId, image })
    .where(eq(user.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}
