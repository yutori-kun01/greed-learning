import React from 'react';
import { requireAdmin } from '@/lib/session';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import EditPostForm from './EditPostForm';

export default async function AdminPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  // The layout's redirect streams in parallel with this page, so check here
  // too rather than run admin queries for a non-admin first.
  await requireAdmin();
  const { id } = await params;
  const db = getDb(process.env.DB as unknown as D1Database);

  const postList = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (postList.length === 0) return notFound();
  const post = postList[0];

  return (
    <EditPostForm
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        status: post.status,
        price: post.price,
      }}
    />
  );
}
