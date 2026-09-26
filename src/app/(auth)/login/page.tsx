'use client';
import React, { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suspendedNotice, setSuspendedNotice] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('suspended') === '1') {
      setSuspendedNotice(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn.email({
      email,
      password,
    });

    if (res.error) {
      // メール確認が必須の設定では、未確認のうちはログインできない。
      setError(
        res.error.code === 'EMAIL_NOT_VERIFIED'
          ? 'メールアドレスの確認が完了していません。確認メールを再送しましたので、メール内のリンクから確認してください。'
          : res.error.message || 'ログインに失敗しました'
      );
      setLoading(false);
    } else {
      router.push('/dashboard'); // or /courses
    }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-subtitle">会員サイトへログイン</p>

      {suspendedNotice && <div className="auth-error">このアカウントは利用停止中です。心当たりがない場合はサポートまでお問い合わせください。</div>}
      {error && <div className="auth-error">{error}</div>}

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

        <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>

        <p className="auth-note">
          <a href="/forgot-password">パスワードをお忘れですか？</a>
        </p>
      </form>
    </div>
  );
}
