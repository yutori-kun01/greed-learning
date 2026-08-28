'use client';
import React from 'react';
import Icon from '../Icon';
import { ThemeToggle } from '../ThemeToggle';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>会員サイト・講座一覧</h1>
        <p>実践に直結する講座を体系的に学び、成果につなげましょう。</p>
      </div>
      <div className="topbar-tools">
        <label className="search">
          <Icon name="search" />
          <input id="search" type="search" placeholder="講座を検索..." autoComplete="off" />
          <kbd>⌘K</kbd>
        </label>
        <button className="btn btn-gold" type="button">
          <Icon name="history" />学習履歴
        </button>
        <ThemeToggle />
        
        {session?.user ? (
          <div className="user" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => {
            if(window.confirm('ログアウトしますか？')) handleLogout();
          }}>
            <span className="avatar" aria-hidden="true" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#16233a', borderRadius: '50%' }}>
              {session.user.image ? (
                <img src={session.user.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="24" fill="#16233a"/>
                  <circle cx="24" cy="19" r="8" fill="#d9b45b" opacity=".85"/>
                  <path d="M8 45c2-9 8.5-13 16-13s14 4 16 13z" fill="#d9b45b" opacity=".6"/>
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
