'use client';
import React, { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useTurnstile } from '@/components/Turnstile';
import { authErrorMessage } from '@/lib/authErrors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suspendedNotice, setSuspendedNotice] = useState(false);
  const [akinaiEnabled, setAkinaiEnabled] = useState(false);
  const router = useRouter();
  const turnstile = useTurnstile();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('error')) {
      setError('Akinai hubでのログインを完了できませんでした。ご購入時のメールアドレスでお試しいただくか、サポートまでお問い合わせください。');
    }
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('suspended') === '1') {
      setSuspendedNotice(true);
    }
    fetch('/api/akinai/status')
      .then((r) => r.json() as Promise<{ enabled?: boolean }>)
      .then((d) => setAkinaiEnabled(!!d.enabled))
      .catch(() => setAkinaiEnabled(false));
  }, []);

  const handleAkinai = async () => {
    setLoading(true);
    setError('');
    const res = await signIn.social({ provider: 'akinai', callbackURL: '/dashboard', errorCallbackURL: '/login?error=akinai' });
    if (res?.error) {
      setError(authErrorMessage(res.error, 'Akinai hubでのログインを開始できませんでした'));
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstile.required && !turnstile.token) {
      setError('ボット対策のチェックを完了してください。');
      return;
    }
    setLoading(true);
    setError('');

    const res = await signIn.email({
      email,
      password,
      fetchOptions: { headers: turnstile.headers },
    });

    if (res.error) {
      setError(authErrorMessage(res.error, 'ログインに失敗しました'));
      setLoading(false);
      turnstile.reset();
    } else {
      router.push('/dashboard'); // or /courses
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">会員サイトへログイン</p>

        {suspendedNotice && <div className="auth-error">このアカウントは利用停止中です。心当たりがない場合はサポートまでお問い合わせください。</div>}
        {error && <div className="auth-error">{error}</div>}

        {akinaiEnabled && (
          <div className="auth-form" style={{ marginBottom: 20 }}>
            <button type="button" className="btn btn-gold btn-block" onClick={handleAkinai} disabled={loading}>
              Akinai hubでログイン（購入者の方）
            </button>
            <p className="auth-foot" style={{ marginTop: 8 }}>ご購入時のメールアドレスに届く認証コードでログインします。</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-label">
            <span>メールアドレス</span>
            <input 
              type="email" 
              className="auth-input" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          
          <label className="auth-label">
            <span>パスワード</span>
            <input 
              type="password" 
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {turnstile.widget}

          <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <p className="auth-foot">
            <a href="/forgot-password" className="auth-link">パスワードをお忘れですか？</a>
          </p>
        </form>
      </div>
    </div>
  );
}
