'use client';
import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { useSession } from '@/lib/auth-client';

export default function Sidebar({ siteName = 'N8N MARKETING', logoUrl }: { siteName?: string; logoUrl?: string | null }) {
  const { data: session } = useSession();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          {logoUrl ? (
            <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <svg viewBox="0 0 40 40">
              <path d="M8 30V11l12 13V11l12 19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
              <circle cx="20" cy="6" r="2.4" fill="currentColor"/>
            </svg>
          )}
        </span>
        <span className="brand-text">{siteName}</span>
      </div>

      <nav className="nav">
        <Link href="/dashboard" className="nav-item">
          <Icon name="home" />ダッシュボード
        </Link>
        <Link href="/courses" className="nav-item is-active" aria-current="page">
          <Icon name="book" />講座一覧
        </Link>
        <Link href="/learning" className="nav-item">
          <Icon name="play" />学習中の講座
        </Link>
        <Link href="/bookmarks" className="nav-item">
          <Icon name="bookmark" />ブックマーク
        </Link>
        <Link href="/resources" className="nav-item">
          <Icon name="gift" />リソース・特典
        </Link>
        <a href="https://discord.gg/INVITE_CODE" target="_blank" rel="noopener noreferrer" className="nav-item">
          <Icon name="users" />Discord コミュニティ
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--muted)' }}>↗</span>
        </a>
        <Link href="/support" className="nav-item">
          <Icon name="life" />サポート
        </Link>
        <Link href="/settings" className="nav-item">
          <Icon name="settings" />設定
        </Link>
        {session?.user && (session.user as any).role === 'ADMIN' && (
          <Link href="/admin" className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid var(--line)' }}>
            <Icon name="lock" />管理者ダッシュボード
          </Link>
        )}
      </nav>

      <div className="side-cards">
        <section className="side-card">
          <p className="side-card-label">今月の学習時間</p>
          <p className="side-card-value">18.6<span>時間</span></p>
          <p className="side-card-sub">先月比<span className="up">▲ +32.4%</span></p>
          <div className="spark">
            <div className="spark-col"><span style={{ height: '52%' }}></span><em>W1</em></div>
            <div className="spark-col"><span style={{ height: '70%' }}></span><em>W2</em></div>
            <div className="spark-col"><span className="dim" style={{ height: '44%' }}></span><em>W3</em></div>
            <div className="spark-col"><span style={{ height: '88%' }}></span><em>W4</em></div>
          </div>
        </section>

        <section className="side-card">
          <p className="side-card-label">連続学習日数</p>
          <p className="side-card-value">14<span>日</span></p>
          <p className="side-card-sub">ベスト記録 27 日</p>
        </section>
      </div>
    </aside>
  );
}
