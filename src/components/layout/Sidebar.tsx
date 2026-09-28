'use client';
import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { DEFAULT_LOGO_URL, DEFAULT_SITE_NAME } from '@/lib/brand';

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

export default function Sidebar({ siteName = DEFAULT_SITE_NAME, logoUrl, currentStreak, longestStreak }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- operator-supplied host */}
          <img src={logoUrl || DEFAULT_LOGO_URL} alt="" />
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
