import { getDb } from '@/db';
import { siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_SITE_SETTINGS = {
  id: '1',
  siteName: 'N8N MARKETING',
  logoUrl: null,
  accentColor: '#d9b45b',
  bgPattern: 'pattern1',
  updatedAt: new Date().toISOString(),
};

export async function getSiteSettingsQuery() {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, '1')).limit(1);
    return settings[0] || DEFAULT_SITE_SETTINGS;
  } catch (e) {
    return DEFAULT_SITE_SETTINGS; // DB not ready or missing table
  }
}
