import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';

export async function getPosts() {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    return await db.select().from(blogPosts).orderBy(blogPosts.createdAt);
  } catch (e) {
    return [];
  }
}

export async function getPublishedPosts() {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    return await db.select().from(blogPosts)
      .where(ne(blogPosts.status, 'DRAFT'))
      .orderBy(blogPosts.createdAt);
  } catch (e) {
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const db = getDb(process.env.DB as unknown as D1Database);
    const data = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    return data[0] || null;
  } catch (e) {
    return null;
  }
}
