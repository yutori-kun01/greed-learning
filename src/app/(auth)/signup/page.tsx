'use client';
import React, { useState } from 'react';
import { signUp } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signUp.email({
      name,
      email,
      password,
    });

    if (res.error) {
      setError(res.error.message || 'アカウント作成に失敗しました');
      setLoading(false);
    } else if (!res.data?.token) {
      // メール確認が必須の設定では自動ログインされない。確認メールの案内を出す。
      setVerificationSent(true);
      setLoading(false);
    } else {
      router.push('/dashboard'); // or /courses
    }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">新規会員登録</p>

      {error && <div className="auth-error">{error}</div>}

      {verificationSent ? (
        <>
          <div className="auth-success">
            確認メールを送信しました。メール内のリンクからメールアドレスを確認すると、ログインできるようになります。
          </div>
          <p className="auth-note">
            メールが届かない場合は迷惑メールフォルダをご確認ください。<a href="/login">ログイン画面へ</a>
          </p>
        </>
      ) : (
      <form onSubmit={handleSignup} className="auth-form">
        <label className="auth-label">
          <span>お名前</span>
          <input 
            type="text" 
            className="auth-input" 
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>
        
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
          {loading ? '登録中...' : 'アカウントを作成'}
        </button>

        <p className="auth-note">
          登録することで<a href="/legal/terms">利用規約</a>および<a href="/legal/privacy">プライバシーポリシー</a>に同意したものとみなされます。
        </p>
      </form>
      )}
    </div>
  );
}
