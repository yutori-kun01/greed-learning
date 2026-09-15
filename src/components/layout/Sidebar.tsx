'use client';
import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { DEFAULT_SITE_NAME } from '@/lib/siteSettings.shared';

export type SidebarStats = {
  /** Lessons completed this month, and the month before it, for the trend line. */
  completedThisMonth: number;
  completedLastMonth: number;
  weeklyCompletions: { label: string; count: number }[];
  currentStreak: number;
  longestStreak: number;
};

const NAV_ITEMS = [
  { href: '/dashboard', icon: 'home', label: 'ダッシュボード' },
  { href: '/courses', icon: 'book', label: '講座一覧' },
  { href: '/learning', icon: 'play', label: '学習中の講座' },
  { href: '/bookmarks', icon: 'bookmark', label: 'ブックマーク' },
  { href: '/resources', icon: 'gift', label: 'リソース・特典' },
] as const;

const NAV_ITEMS_TAIL = [
  { href: '/support', icon: 'life', label: 'サポート' },
  { href: '/settings', icon: 'settings', label: '設定' },
] as const;

export default function Sidebar({
  siteName = DEFAULT_SITE_NAME,
  logoUrl,
  stats,
}: {
  siteName?: string;
  logoUrl?: string | null;
  stats: SidebarStats;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const { completedThisMonth, completedLastMonth, weeklyCompletions } = stats;
  const trend =
    completedLastMonth > 0
      ? Math.round(((completedThisMonth - completedLastMonth) / completedLastMonth) * 1000) / 10
      : null;
  const peakWeek = Math.max(1, ...weeklyCompletions.map(w => w.count));

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
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? ' is-active' : ''}`}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <Icon name={item.icon} />{item.label}
          </Link>
        ))}
        <a href="https://discord.gg/INVITE_CODE" target="_blank" rel="noopener noreferrer" className="nav-item">
          <Icon name="users" />Discord コミュニティ
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--muted)' }}>↗</span>
        </a>
        {NAV_ITEMS_TAIL.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? ' is-active' : ''}`}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <Icon name={item.icon} />{item.label}
          </Link>
        ))}
        {session?.user && (session.user as any).role === 'ADMIN' && (
          <Link href="/admin" className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid var(--line)' }}>
            <Icon name="lock" />管理者ダッシュボード
          </Link>
        )}
      </nav>

      <div className="side-cards">
        <section className="side-card">
          <p className="side-card-label">今月の完了レッスン</p>
          <p className="side-card-value">{completedThisMonth}<span>件</span></p>
          <p className="side-card-sub">
            {trend === null ? (
              completedLastMonth === 0 && completedThisMonth === 0 ? '先月も今月もまだ記録がありません' : '先月の記録はありません'
            ) : (
              <>先月比<span className={trend >= 0 ? 'up' : ''}>{trend >= 0 ? '▲ +' : '▼ '}{trend}%</span></>
            )}
          </p>
          <div className="spark">
            {weeklyCompletions.map(week => (
              <div className="spark-col" key={week.label}>
                <span
                  className={week.count === 0 ? 'dim' : undefined}
                  style={{ height: `${Math.round((week.count / peakWeek) * 100)}%` }}
                />
                <em>{week.label}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="side-card">
          <p className="side-card-label">連続学習日数</p>
          <p className="side-card-value">{stats.currentStreak}<span>日</span></p>
          <p className="side-card-sub">ベスト記録 {stats.longestStreak} 日</p>
        </section>
      </div>
    </aside>
  );
}
