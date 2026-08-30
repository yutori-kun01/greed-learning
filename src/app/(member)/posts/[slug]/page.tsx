import React from 'react';
import { getPostBySlug } from '@/actions/posts';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/db';
import { purchases } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createCheckoutSession } from '@/actions/stripe';

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status === 'DRAFT') {
    notFound();
  }

  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  // Protection logic
  if (post.status === 'MEMBERS_ONLY' && !session) {
    return (
      <div style={{ maxWidth: 800, margin: '64px auto', textAlign: 'center' }}>
        <div className="panel" style={{ padding: 48 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>この記事は会員限定です</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>
            続きを読むにはログインまたは無料会員登録が必要です。
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <a href="/login" className="btn btn-ghost">ログイン</a>
            <a href="/signup" className="btn btn-gold">無料会員登録</a>
          </div>
        </div>
      </div>
    );
  }

  // Check purchases table for PAID posts
  let isPurchased = false;
  if (post.status === 'PAID' && session) {
    const db = getDb(process.env.DB as unknown as D1Database);
    const purchaseRecords = await db.select()
      .from(purchases)
      .where(and(
        eq(purchases.userId, session.user.id),
        eq(purchases.postId, post.id)
      ))
      .limit(1);
    
    if (purchaseRecords.length > 0) {
      isPurchased = true;
    }
  }

  const handleCheckout = async () => {
    'use server';
    await createCheckoutSession(post.id);
  };

  const renderContent = () => {
    if (post.status === 'PAID' && !isPurchased) {
      // split content by paywall if exists
      const paywallSplit = post.content ? post.content.split('<!-- PAYWALL -->') : [''];
      const freeContent = paywallSplit[0];
      
      return (
        <>
          <div 
            className="prose"
            style={{ fontSize: 16, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: freeContent }}
          />
          <div style={{ margin: '48px 0', padding: 32, background: 'linear-gradient(180deg, var(--panel), var(--panel-2))', borderRadius: 12, border: '1px solid rgba(217,180,91,0.2)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, color: 'var(--gold-2)', marginBottom: 12 }}>ここから先は有料コンテンツです</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>
              この記事の続きを閲覧するには購入が必要です。
            </p>
            {session ? (
              <form action={handleCheckout}>
                <button type="submit" className="btn btn-gold" style={{ fontSize: 15, padding: '12px 24px' }}>
                  記事を購入する（¥{post.price?.toLocaleString()}）
                </button>
              </form>
            ) : (
              <a href="/login" className="btn btn-gold" style={{ fontSize: 15, padding: '12px 24px' }}>
                ログインして購入する
              </a>
            )}
          </div>
        </>
      );
    }

    return (
      <div 
        className="prose"
        style={{ fontSize: 16, lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />
    );
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 64 }}>
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--line)', paddingBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, marginBottom: 16 }}>
          {post.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--muted)', fontSize: 13 }}>
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('ja-JP')}</span>
          {post.status === 'PAID' && <span style={{ color: 'var(--gold)', fontWeight: 600, padding: '2px 8px', background: 'rgba(217,180,91,0.1)', borderRadius: 4 }}>有料記事</span>}
          {post.status === 'MEMBERS_ONLY' && <span style={{ color: '#6495ed', fontWeight: 600, padding: '2px 8px', background: 'rgba(100,149,237,0.1)', borderRadius: 4 }}>会員限定</span>}
        </div>
      </div>
      
      <div style={{ color: 'var(--text)' }}>
        {renderContent()}
      </div>
    </div>
  );
}
