import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { purchases } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPostBySlug } from '@/lib/queries';
import { optionalUser } from '@/lib/session';
import { createCheckoutSession } from '@/actions/stripe';
import XShareLink from '@/components/XShareLink';
import { splitAtPaywall } from '@/lib/paywall';

function Gate({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        margin: '48px 0',
        padding: 32,
        background: 'linear-gradient(180deg, var(--panel), var(--panel-2))',
        borderRadius: 12,
        border: '1px solid rgba(217,180,91,0.2)',
        textAlign: 'center',
      }}
    >
      <h3 style={{ fontSize: 18, color: 'var(--gold-2)', marginBottom: 12 }}>{title}</h3>
      <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>{body}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  // Drafts do not exist as far as readers are concerned.
  if (!post || post.status === 'DRAFT') {
    notFound();
  }

  const me = await optionalUser();

  let isPurchased = false;
  if (post.status === 'PAID' && me) {
    const db = getDb(process.env.DB as unknown as D1Database);
    const rows = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(and(eq(purchases.userId, me.id), eq(purchases.postId, post.id)))
      .limit(1);
    isPurchased = rows.length > 0;
  }

  const handleCheckout = async () => {
    'use server';
    await createCheckoutSession(post.id);
  };

  const prose = (html: string) => (
    <div
      className="prose"
      style={{ fontSize: 16, lineHeight: 1.8 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  function renderBody() {
    // Members-only: readable by anyone signed in, gated for everyone else.
    if (post.status === 'MEMBERS_ONLY' && !me) {
      return (
        <Gate
          title="この記事は会員限定です"
          body="続きを読むにはログインまたは会員登録が必要です。"
        >
          <Link href="/login" className="btn btn-ghost">ログイン</Link>
          <Link href="/signup" className="btn btn-gold">会員登録</Link>
        </Gate>
      );
    }

    // Paid: the free preview is whatever the author placed before the paywall
    // marker. With no marker, nothing is free.
    if (post.status === 'PAID' && !isPurchased) {
      const { free, hasMarker } = splitAtPaywall(post.content);
      return (
        <>
          {free && prose(free)}
          <Gate
            title="ここから先は有料コンテンツです"
            body={
              hasMarker
                ? 'この記事の続きを閲覧するには購入が必要です。'
                : 'この記事を閲覧するには購入が必要です。'
            }
          >
            {me ? (
              <form action={handleCheckout}>
                <button type="submit" className="btn btn-gold" style={{ fontSize: 15, padding: '12px 24px' }}>
                  記事を購入する（¥{post.price?.toLocaleString()}）
                </button>
              </form>
            ) : (
              <Link href="/login" className="btn btn-gold" style={{ fontSize: 15, padding: '12px 24px' }}>
                ログインして購入する
              </Link>
            )}
          </Gate>
        </>
      );
    }

    return prose(post.content || '');
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/posts/${post.slug}`;
  // Members-only posts are not shareable to people who cannot open them.
  const shareable = post.status === 'PUBLISHED' || post.status === 'PAID';

  return (
    <article style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 64 }}>
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--line)', paddingBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, marginBottom: 16 }}>
          {post.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--muted)', fontSize: 13 }}>
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('ja-JP')}</span>
          {post.status === 'PAID' && (
            <span style={{ color: 'var(--gold)', fontWeight: 600, padding: '2px 8px', background: 'rgba(217,180,91,0.1)', borderRadius: 4 }}>
              有料記事
            </span>
          )}
          {post.status === 'MEMBERS_ONLY' && (
            <span style={{ color: '#6495ed', fontWeight: 600, padding: '2px 8px', background: 'rgba(100,149,237,0.1)', borderRadius: 4 }}>
              会員限定
            </span>
          )}
        </div>

        {shareable && (
          <div style={{ marginTop: 20 }}>
            <XShareLink text={post.title} url={shareUrl} />
          </div>
        )}
      </div>

      <div style={{ color: 'var(--text)' }}>{renderBody()}</div>

      {shareable && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
            この記事が参考になったらシェアしてください
          </p>
          <XShareLink text={post.title} url={shareUrl} />
        </div>
      )}
    </article>
  );
}
