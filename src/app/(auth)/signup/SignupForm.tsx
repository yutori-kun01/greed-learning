'use client';
import React, { useState } from 'react';
import { signUp } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useTurnstile } from '@/components/Turnstile';
import { authErrorMessage } from '@/lib/authErrors';

export default function SignupForm({ notice }: { notice?: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const turnstile = useTurnstile();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstile.required && !turnstile.token) {
      setError('ボット対策のチェックを完了してください。');
      return;
    }
    setLoading(true);
    setError('');

    const res = await signUp.email({
      name,
      email,
      password,
      fetchOptions: { headers: turnstile.headers },
    });

    if (res.error) {
      setError(authErrorMessage(res.error, 'アカウント作成に失敗しました'));
      setLoading(false);
      turnstile.reset();
    } else {
      router.push('/dashboard'); // or /courses
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">新規会員登録</p>

        {notice && <div className="auth-notice" style={{ marginBottom: 16 }}>{notice}</div>}
        {error && <div className="auth-error">{error}</div>}

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
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {turnstile.widget}

          <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
            {loading ? '登録中...' : 'アカウントを作成'}
          </button>

          <p className="auth-foot">
            登録することで<a href="/legal/terms" className="auth-link">利用規約</a>および<a href="/legal/privacy" className="auth-link">プライバシーポリシー</a>に同意したものとみなされます。
          </p>
        </form>
      </div>
    </div>
  );
}
