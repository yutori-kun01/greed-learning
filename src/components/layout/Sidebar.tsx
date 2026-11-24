'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { ThemeToggle } from '../ThemeToggle';
import { DEFAULT_LOGO_URL, DEFAULT_SITE_NAME } from '@/lib/brand';

type SidebarProps = {
  siteName?: string;
  logoUrl?: string | null;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
};

const NAV = [
  { href: '/dashboard', icon: 'home', label: 'ダッシュボード' },
  { href: '/courses', icon: 'book', label: '講座一覧' },
  { href: '/learning', icon: 'play', label: '学習中の講座' },
  { href: '/bookmarks', icon: 'bookmark', label: 'ブックマーク' },
  { href: '/resources', icon: 'gift', label: 'リソース・特典' },
  { href: '/rewards', icon: 'star', label: '特典・ポイント' },
  { href: '/support', icon: 'life', label: 'サポート' },
  { href: '/settings', icon: 'settings', label: '設定' },
] as const;

// Phone-only bottom bar: the pages a member opens most. Everything else is in
// the menu, which the last tab opens.
const TABS = [
  { href: '/dashboard', icon: 'home', label: 'ホーム' },
  { href: '/courses', icon: 'book', label: '講座' },
  { href: '/learning', icon: 'play', label: '学習中' },
  { href: '/rewards', icon: 'star', label: 'ポイント' },
] as const;

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * On a computer: the fixed left sidebar. On a phone (≤680px, see globals.css):
 * a slim sticky header with the logo and a menu button, the full menu as a
 * drop-down drawer, and a bottom tab bar — so a lesson's video is on the first
 * screen instead of below two rows of menu and the page header.
 */
export default function Sidebar({ siteName = DEFAULT_SITE_NAME, logoUrl, currentStreak, longestStreak, totalPoints }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  // Navigating closes the menu. Adjusted during render, not in an effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Keep the page behind an open menu from scrolling.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    await signOut();
    router.push('/login');
  };

  return (
    <>
      <aside className={open ? 'sidebar is-open' : 'sidebar'}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- operator-supplied host */}
            <img src={logoUrl || DEFAULT_LOGO_URL} alt="" />
          </span>
          <span className="brand-text">{siteName}</span>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="side-drawer"
            aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>

        <div className="side-drawer" id="side-drawer">
          <nav className="nav">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
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
            {isAdmin && (
              <Link href="/admin" className="nav-item nav-item-admin">
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
            <Link href="/rewards" className="side-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <p className="side-card-label">累計ポイント</p>
              <p className="side-card-value">{totalPoints.toLocaleString()}<span>pt</span></p>
              <p className="side-card-sub">特典・ポイント交換を見る →</p>
            </Link>
          </div>

          {/* On a phone the page header (theme, account) is hidden; its tools live here. */}
          <div className="drawer-tools">
            <span className="drawer-tools-label">テーマ</span>
            <ThemeToggle />
            {session?.user && (
              <button type="button" className="btn btn-ghost drawer-logout" onClick={handleLogout}>
                <Icon name="logout" />ログアウト
              </button>
            )}
          </div>
        </div>
      </aside>

      {open && <div className="drawer-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />}

      <nav className="tabbar" aria-label="メインメニュー">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? 'tab is-active' : 'tab'}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={open ? 'tab is-active' : 'tab'}
          aria-expanded={open}
          aria-controls="side-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="menu" />
          <span>メニュー</span>
        </button>
      </nav>
    </>
  );
}
