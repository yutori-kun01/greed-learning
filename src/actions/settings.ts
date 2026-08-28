'use server';

import { getDb } from '@/db';
import { user, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

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

  const siteName = formData.get('siteName') as string;
  const accentColor = formData.get('accentColor') as string;
  const bgPattern = formData.get('bgPattern') as string;

  await db().insert(siteSettings).values({
    id: '1',
    siteName,
    accentColor,
    bgPattern,
    updatedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: siteSettings.id,
    set: {
      siteName,
      accentColor,
      bgPattern,
      updatedAt: new Date().toISOString(),
    }
  });

  revalidatePath('/', 'layout');
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

  const name = formData.get('name') as string;
  const noteId = formData.get('noteId') as string;
  const xId = formData.get('xId') as string;

  await db().update(user)
    .set({ name, noteId, xId })
    .where(eq(user.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}

export async function getSiteSettingsQuery() {
  try {
    const settings = await db().select().from(siteSettings).where(eq(siteSettings.id, '1')).limit(1);
    return settings[0] || null;
  } catch (e) {
    return null; // DB not ready or missing table
  }
}
