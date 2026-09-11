'use server';

import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';
import { sanitizeHtml } from '@/lib/sanitize';

const db = () => getDb(process.env.DB as unknown as D1Database);

const STATUSES = ['DRAFT', 'PUBLISHED', 'MEMBERS_ONLY', 'PAID'] as const;
type PostStatus = (typeof STATUSES)[number];

function readForm(formData: FormData) {
  const title = (formData.get('title') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim();

  if (!title || !slug) {
    throw new Error('タイトルとスラッグは必須です');
  }

  const rawStatus = formData.get('status') as string;
  const status: PostStatus = STATUSES.includes(rawStatus as PostStatus)
    ? (rawStatus as PostStatus)
    : 'DRAFT';

  const price = formData.get('price') ? parseInt(formData.get('price') as string, 10) : 0;
  if (status === 'PAID' && (!Number.isFinite(price) || price <= 0)) {
    throw new Error('有料記事には1円以上の価格を設定してください');
  }

  return {
    title,
    slug,
    status,
    price: Number.isFinite(price) ? price : 0,
    content: sanitizeHtml(formData.get('content') as string),
  };
}

export async function createPost(formData: FormData) {
  const admin = await requireAdmin();
  const { title, slug, status, price, content } = readForm(formData);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db().insert(blogPosts).values({
    id,
    slug,
    title,
    content,
    status,
    price,
    authorId: admin.id,
    createdAt: now,
    updatedAt: now,
    publishedAt: status !== 'DRAFT' ? now : null,
  });

  revalidatePath('/admin/posts');
  return { success: true, postId: id };
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();
  const { title, slug, status, price, content } = readForm(formData);

  const existing = await db().select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  const now = new Date().toISOString();

  await db()
    .update(blogPosts)
    .set({
      title,
      slug,
      content,
      status,
      price,
      updatedAt: now,
      publishedAt: existing[0]?.publishedAt || (status !== 'DRAFT' ? now : null),
    })
    .where(eq(blogPosts.id, id));

  revalidatePath('/admin/posts');
  revalidatePath(`/posts/${slug}`);
  return { success: true };
}

export async function deletePost(id: string) {
  await requireAdmin();
  await db().delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath('/admin/posts');
  return { success: true };
}
