import React from 'react';
import Link from 'next/link';
import { getPublishedPostSummaries } from '@/lib/queries';
import Icon from '@/components/Icon';

function StatusBadge({ status }: { status: string }) {
  if (status === 'MEMBERS_ONLY') {
    return <span className="badge" style={{ background: '#6495ed', color: '#fff' }}>会員限定</span>;
  }
  if (status === 'PAID') {
    return <span className="badge" style={{ background: 'var(--gold)', color: '#23180a' }}>有料記事</span>;
  }
  return null;
}

export default async function PostsPage() {
  const posts = await getPublishedPostSummaries();

  return (
    <div style={{ paddingBottom: 64 }}>
      <h1 className="section-title">記事一覧</h1>
      <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>
        最新のノウハウやアップデート情報をお届けします。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {posts.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, gridColumn: '1 / -1' }}>
            公開されている記事がありません。
          </div>
        ) : (
          posts.map((post: {
            id: string;
            slug: string;
            title: string;
            excerpt: string | null;
            status: string;
            price: number | null;
            publishedAt: string | null;
            createdAt: string;
          }) => (
            <Link href={`/posts/${post.slug}`} key={post.id} style={{ textDecoration: 'none' }}>
              <article className="card" style={{ height: '100%', cursor: 'pointer' }}>
                <div className="thumb" style={{ aspectRatio: '1.9/1', background: 'var(--panel-2)' }}>
                  <StatusBadge status={post.status} />
                </div>
                <div className="card-body">
                  <h3 className="card-title" style={{ fontSize: 16, lineHeight: 1.4, marginBottom: 8 }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted)', marginTop: 'auto' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    {post.status === 'PAID' && (
                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                        ¥{post.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
