'use client';
import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

type SidebarProps = {
  siteName?: string;
  logoUrl?: string | null;
  currentStreak: number;
  longestStreak: number;
};

const NAV = [
  { href: '/dashboard', icon: 'home', label: 'ダッシュボード' },
  { href: '/courses', icon: 'book', label: '講座一覧' },
  { href: '/learning', icon: 'play', label: '学習中の講座' },
  { href: '/bookmarks', icon: 'bookmark', label: 'ブックマーク' },
  { href: '/resources', icon: 'gift', label: 'リソース・特典' },
  { href: '/support', icon: 'life', label: 'サポート' },
  { href: '/settings', icon: 'settings', label: '設定' },
] as const;

export default function Sidebar({ siteName = 'N8N MARKETING', logoUrl, currentStreak, longestStreak }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

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
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'nav-item is-active' : 'nav-item'}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={item.icon} />{item.label}
            </Link>
          );
        })}
        {session?.user && (session.user as any).role === 'ADMIN' && (
          <Link href="/admin" className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid var(--line)' }}>
            <Icon name="lock" />管理者ダッシュボード
          </Link>
        )}
      </nav>

      <div className="side-cards">
        <section className="side-card">
          <p className="side-card-label">連続学習日数</p>
          <p className="side-card-value">{currentStreak}<span>日</span></p>
          <p className="side-card-sub">ベスト記録 {longestStreak} 日</p>
        </section>
      </div>
    </aside>
  );
}
