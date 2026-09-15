import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';

/**
 * Blog post queries.
 *
 * These deliberately live outside `actions/posts.ts`: every export of a
 * `'use server'` file becomes a callable endpoint, so keeping them there made
 * draft posts and the body of paid articles reachable without any
 * authorisation check. Callers are server components, which enforce access.
 */
const db = () => getDb(process.env.DB as unknown as D1Database);

/** Every post, drafts included — admin screens only. */
export async function getAllPosts() {
  try {
    return await db().select().from(blogPosts).orderBy(blogPosts.createdAt);
  } catch {
    return [];
  }
}

export async function getPublishedPosts(): Promise<(typeof blogPosts.$inferSelect)[]> {
  try {
    const all = await db().select().from(blogPosts).orderBy(blogPosts.createdAt);
    return all.filter((p: typeof blogPosts.$inferSelect) => p.status !== 'DRAFT');
  } catch {
    return [];
  }
}

/** Returns the full row, paid body included — the caller must gate it. */
export async function getPostBySlug(slug: string) {
  try {
    const data = await db().select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return data[0] || null;
  } catch {
    return null;
  }
}
