'use client';
import React, { useState, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { updateUserProfile } from '@/actions/settings';

const inputStyle = { display: 'block', width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px', padding: '10px 14px', color: '#e9eef7', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' as const };
const labelStyle = { display: 'block', marginBottom: '20px' };

type FieldStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function MemberSettingsForm({ user }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle');
  const [emailError, setEmailError] = useState('');

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<FieldStatus>('idle');
  const [passwordError, setPasswordError] = useState('');

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handleEmailUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('メールアドレスの形式が正しくありません');
      setEmailStatus('error');
      return;
    }
    setEmailError('');
    setEmailStatus('saving');
    setTimeout(() => setEmailStatus('saved'), 800);
  };

  const handlePasswordUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwords.next.length < 8) {
      setPasswordError('新しいパスワードは8文字以上で入力してください');
      setPasswordStatus('error');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('新しいパスワードが一致しません');
      setPasswordStatus('error');
      return;
    }
    setPasswordError('');
    setPasswordStatus('saving');
    setTimeout(() => {
      setPasswordStatus('saved');
      setPasswords({ current: '', next: '', confirm: '' });
    }, 800);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateUserProfile(formData);
        alert('プロフィールを保存しました');
      } catch (err: any) {
        alert(err.message || 'エラーが発生しました');
      }
    });
  };

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="section-title">アカウント設定</h1>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,.07)', paddingBottom: 16 }}>
        <button className={`btn ${activeTab === 'profile' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setActiveTab('profile')}>プロフィール</button>
        <button className={`btn ${activeTab === 'security' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setActiveTab('security')}>セキュリティ・2FA</button>
        <button className={`btn ${activeTab === 'preferences' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setActiveTab('preferences')}>表示設定</button>
      </div>

      {activeTab === 'profile' && (
        <div className="panel">
          <h2 className="panel-title">プロフィール情報</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#16233a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              👤
            </div>
            <div>
              <button className="btn btn-ghost" style={{ marginBottom: 8 }}>画像をアップロード</button>
              <p style={{ fontSize: 12, color: '#7d8b9f' }}>推奨サイズ: 400x400px (JPG/PNG)</p>
            </div>
          </div>
          <form onSubmit={handleProfileUpdate}>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>表示名</span>
              <input type="text" name="name" style={inputStyle} defaultValue={user?.name || ''} required />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>note ID</span>
              <input type="text" name="noteId" style={inputStyle} defaultValue={user?.noteId || ''} placeholder="例: username" />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>X (Twitter) ID</span>
              <input type="text" name="xId" style={inputStyle} defaultValue={user?.xId || ''} placeholder="例: username" />
            </label>
            <button type="submit" className="btn btn-gold" disabled={isPending}>
              {isPending ? '保存中...' : 'プロフィールを保存'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="panel">
          <h2 className="panel-title">セキュリティ設定</h2>
          <form style={{ marginBottom: 32 }} onSubmit={handleEmailUpdate}>
            <h3 style={{ fontSize: 14, color: '#e9eef7', marginBottom: 16 }}>メールアドレスの変更</h3>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>新しいメールアドレス</span>
              <input
                type="email"
                style={inputStyle}
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailStatus('idle'); }}
                placeholder="new@example.com"
              />
            </label>
            {emailStatus === 'error' && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '-12px', marginBottom: 16 }}>{emailError}</p>}
            {emailStatus === 'saved' && <p style={{ color: '#8ce0a8', fontSize: '12px', marginTop: '-12px', marginBottom: 16 }}>確認メールを送信しました。メール内のリンクから変更を完了してください。</p>}
            <button type="submit" className="btn btn-ghost" disabled={emailStatus === 'saving'}>
              {emailStatus === 'saving' ? '更新中...' : 'メールアドレスを更新'}
            </button>
          </form>

          <form style={{ marginBottom: 32, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 24 }} onSubmit={handlePasswordUpdate}>
            <h3 style={{ fontSize: 14, color: '#e9eef7', marginBottom: 16 }}>パスワードの変更</h3>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>現在のパスワード</span>
              <input
                type="password"
                style={inputStyle}
                value={passwords.current}
                onChange={(e) => { setPasswords({ ...passwords, current: e.target.value }); setPasswordStatus('idle'); }}
              />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>新しいパスワード</span>
              <input
                type="password"
                style={inputStyle}
                value={passwords.next}
                onChange={(e) => { setPasswords({ ...passwords, next: e.target.value }); setPasswordStatus('idle'); }}
              />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>新しいパスワード（確認）</span>
              <input
                type="password"
                style={inputStyle}
                value={passwords.confirm}
                onChange={(e) => { setPasswords({ ...passwords, confirm: e.target.value }); setPasswordStatus('idle'); }}
              />
            </label>
            {passwordStatus === 'error' && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '-12px', marginBottom: 16 }}>{passwordError}</p>}
            {passwordStatus === 'saved' && <p style={{ color: '#8ce0a8', fontSize: '12px', marginTop: '-12px', marginBottom: 16 }}>パスワードを更新しました。</p>}
            <button type="submit" className="btn btn-ghost" disabled={passwordStatus === 'saving'}>
              {passwordStatus === 'saving' ? '更新中...' : 'パスワードを更新'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 24 }}>
            <h3 style={{ fontSize: 14, color: '#e9eef7', marginBottom: 16 }}>二段階認証 (2FA)</h3>
            {twoFAEnabled ? (
              <>
                <p style={{ fontSize: 13, color: '#8ce0a8', marginBottom: 16 }}>✓ 2FAは有効になっています。</p>
                <button type="button" className="btn btn-ghost" onClick={() => setTwoFAEnabled(false)}>2FAを無効にする</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#b6c1d2', marginBottom: 16 }}>アカウントのセキュリティを高めるために、2FAを有効にしてください。</p>
                <button type="button" className="btn btn-gold" onClick={() => setTwoFAEnabled(true)}>2FAを設定する</button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="panel">
          <h2 className="panel-title">表示設定</h2>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600, display: 'block', marginBottom: 12 }}>テーマ（外観）</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <button 
                type="button" 
                onClick={() => setTheme('light')}
                style={{ flex: 1, padding: 20, background: theme === 'light' ? 'rgba(217,180,91,.1)' : '#101d31', border: `2px solid ${theme === 'light' ? '#f2d992' : 'rgba(255,255,255,.07)'}`, borderRadius: 8, cursor: 'pointer', color: '#e9eef7', fontWeight: 600 }}
              >
                ☀️ ライトモード
              </button>
              <button 
                type="button" 
                onClick={() => setTheme('dark')}
                style={{ flex: 1, padding: 20, background: theme === 'dark' ? 'rgba(217,180,91,.1)' : '#101d31', border: `2px solid ${theme === 'dark' ? '#f2d992' : 'rgba(255,255,255,.07)'}`, borderRadius: 8, cursor: 'pointer', color: '#e9eef7', fontWeight: 600 }}
              >
                🌙 ダークモード
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#7d8b9f', marginTop: 12 }}>※この設定はお使いの端末に保存され、ログインごとに適用されます。</p>
          </label>
        </div>
      )}
    </div>
  );
}
