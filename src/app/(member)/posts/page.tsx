import React from 'react';
import Link from 'next/link';
import { getPublishedPosts } from '@/actions/posts';
import Icon from '@/components/Icon';

export default async function MemberPostsPage() {
  const posts = await getPublishedPosts();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MEMBERS_ONLY': return <span className="badge" style={{ background: '#6495ed', color: '#fff' }}>会員限定</span>;
      case 'PAID': return <span className="badge" style={{ background: 'var(--gold)', color: '#23180a' }}>有料記事</span>;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 64 }}>
      <h1 className="section-title">記事一覧</h1>
      <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>
        最新のノウハウやアップデート情報をお届けします。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {posts.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, gridColumn: '1 / -1' }}>
            公開されている記事がありません。
          </div>
        ) : posts.map((post: any) => (
          <Link href={`/posts/${post.slug}`} key={post.id}>
            <article className="card" style={{ height: '100%', cursor: 'pointer' }}>
              <div className="thumb" style={{ aspectRatio: '1.9/1', background: 'var(--panel-2)' }}>
                {getStatusBadge(post.status)}
              </div>
              <div className="card-body">
                <h3 className="card-title" style={{ fontSize: 16, lineHeight: 1.4, marginBottom: 8 }}>
                  {post.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted)', marginTop: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="clock" />
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  {post.status === 'PAID' && (
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>¥{post.price?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
