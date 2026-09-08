'use server';

import { getDb } from '@/db';
import { user, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

// Helper for DB instance
const db = () => getDb(process.env.DB as unknown as D1Database);

const DEFAULT_SITE_SETTINGS = {
  id: '1',
  siteName: 'N8N MARKETING',
  logoUrl: null,
  accentColor: '#d9b45b',
  bgPattern: 'pattern1',
  updatedAt: new Date().toISOString(),
};

export async function updateSiteSettings(formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const siteName = formData.get('siteName') as string;
  let accentColor = formData.get('accentColor') as string;
  const bgPattern = formData.get('bgPattern') as string;

  // XSS protection for CSS injection
  if (!/^#[0-9a-fA-F]{3,6}$/.test(accentColor) && !/^rgba?\([\s\d,%]+\)$/.test(accentColor)) {
    accentColor = '#d9b45b'; // fallback to default
  }

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
  const themePreference = formData.get('themePreference') as 'dark' | 'light';

  await db().update(user)
    .set({ 
      name, 
      noteId: noteId || null, 
      xId: xId || null,
      themePreference: themePreference || 'dark'
    })
    .where(eq(user.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}
