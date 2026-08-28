import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb(process.env.DB as unknown as D1Database);

  const postList = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (postList.length === 0) return notFound();
  const post = postList[0];

  return (
    <div>
      <div className="section-title">
        <Link href="/admin/posts" style={{ color: 'inherit', textDecoration: 'none', marginRight: '8px' }}>
          ← 戻る
        </Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ marginLeft: '8px' }}>記事の編集</span>
      </div>

      <div className="panel" style={{ textAlign: 'center', padding: '40px', color: '#7d8b9f' }}>
        <h2 style={{ color: '#e9eef7', marginBottom: '16px' }}>{post.title}</h2>
        <p>記事の編集UIは近日公開予定です。</p>
        <p>（新規作成時と同様のTipTapエディタをここに実装します）</p>
      </div>
    </div>
  );
}
