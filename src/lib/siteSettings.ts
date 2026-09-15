import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { siteSettings } from '@/db/schema';

export * from './siteSettings.shared';

export type SiteSettings = typeof siteSettings.$inferSelect;

/**
 * Site settings are read by the root layout, `generateMetadata`, and every
 * nested layout, so `cache()` collapses them into a single D1 read per request.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, '1')).limit(1);
    return rows[0] ?? null;
  } catch {
    return null; // DB not ready or table missing — render the defaults.
  }
});
