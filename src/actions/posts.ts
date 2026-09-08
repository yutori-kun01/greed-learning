'use server';

import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

const db = () => getDb(process.env.DB as unknown as D1Database);

export async function createPost(formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;

  if (!title || !slug) {
    throw new Error('タイトルとスラッグは必須です');
  }
  const content = formData.get('content') as string;
  const status = formData.get('status') as "DRAFT" | "PUBLISHED" | "MEMBERS_ONLY" | "PAID";
  const price = formData.get('price') ? parseInt(formData.get('price') as string, 10) : 0;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db().insert(blogPosts).values({
    id,
    slug,
    title,
    content,
    status: status || 'DRAFT',
    price,
    authorId: session.user.id,
    createdAt: now,
    updatedAt: now,
    publishedAt: status !== 'DRAFT' ? now : null,
  });

  revalidatePath('/admin/posts');
  return { success: true, postId: id };
}

export async function updatePost(id: string, formData: FormData) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const status = formData.get('status') as "DRAFT" | "PUBLISHED" | "MEMBERS_ONLY" | "PAID";
  const price = formData.get('price') ? parseInt(formData.get('price') as string, 10) : 0;

  if (!title || !slug) {
    throw new Error('タイトルとスラッグは必須です');
  }

  const now = new Date().toISOString();

  await db().update(blogPosts).set({
    slug,
    title,
    content,
    status: status || 'DRAFT',
    price,
    updatedAt: now,
    ...(status !== 'DRAFT' ? { publishedAt: now } : {})
  }).where(eq(blogPosts.id, id));

  revalidatePath('/admin/posts');
  revalidatePath(`/posts/${slug}`);
  return { success: true };
}

// Queries moved to src/lib/queries/posts.ts

export async function deletePost(id: string) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await db().delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath('/admin/posts');
  return { success: true };
}
