'use client';
import React from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { ThemeToggle } from '../ThemeToggle';
import { useSession, signOut } from '@/lib/auth-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** ページごとの見出し。以前はどの画面でも「講座一覧」と表示していた。 */
const PAGE_TITLES: { prefix: string; title: string; lead: string }[] = [
  { prefix: '/dashboard', title: 'ダッシュボード', lead: '学習の状況をまとめて確認できます。' },
  { prefix: '/learning', title: '学習中の講座', lead: '取り組み中の講座の続きから再開できます。' },
  { prefix: '/bookmarks', title: 'ブックマーク', lead: '後で見返したい講座を集めています。' },
  { prefix: '/resources', title: 'リソース・特典', lead: '講座に付属する配布物をダウンロードできます。' },
  { prefix: '/posts', title: '記事', lead: '会員向けの記事をお読みいただけます。' },
  { prefix: '/support', title: 'サポート', lead: 'よくあるご質問とお問い合わせはこちらから。' },
  { prefix: '/settings', title: 'アカウント設定', lead: 'プロフィール・セキュリティ・プランを管理します。' },
  { prefix: '/courses', title: '会員サイト・講座一覧', lead: '実践に直結する講座を体系的に学び、成果につなげましょう。' },
];

export default function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = React.useRef<HTMLInputElement>(null);

  const page = PAGE_TITLES.find(p => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`))
    ?? PAGE_TITLES[PAGE_TITLES.length - 1];

  // ⌘K / Ctrl+K で検索へフォーカス（kbd表示に実体を持たせる）。
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('q') as string;
    const trimmed = (value || '').trim();
    router.push(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : '/courses');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{page.title}</h1>
        <p>{page.lead}</p>
      </div>
      <div className="topbar-tools">
        <form className="search" onSubmit={handleSearch} role="search">
          <Icon name="search" />
          <input
            ref={searchRef}
            id="search"
            name="q"
            type="search"
            placeholder="講座を検索..."
            autoComplete="off"
            defaultValue={searchParams.get('q') ?? ''}
          />
          <kbd>⌘K</kbd>
        </form>
        <Link className="btn btn-gold" href="/dashboard">
          <Icon name="history" />学習の記録
        </Link>
        <ThemeToggle />
        
        {session?.user ? (
          <div className="user" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => {
            if(window.confirm('ログアウトしますか？')) handleLogout();
          }}>
            <span className="avatar" aria-hidden="true" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-3)', borderRadius: '50%' }}>
              {session.user.image ? (
                <img src={session.user.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="24" fill="var(--panel-3)"/>
                  <circle cx="24" cy="19" r="8" fill="var(--gold)" opacity=".85"/>
                  <path d="M8 45c2-9 8.5-13 16-13s14 4 16 13z" fill="var(--gold)" opacity=".6"/>
                </svg>
              )}
            </span>
            <span className="user-text">
              <b>{session.user.name.toUpperCase()}</b>
              <em>{(session.user as any).role === 'ADMIN' ? '管理者' : 'メンバー'}</em>
            </span>
          </div>
        ) : (
          <div className="user">
            <span className="user-text"><b>未ログイン</b></span>
          </div>
        )}
      </div>
    </header>
  );
}
