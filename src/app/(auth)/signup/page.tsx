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
    } else {
      router.push('/dashboard'); // or /courses
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">新規会員登録</p>

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
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
            {loading ? '登録中...' : 'アカウントを作成'}
          </button>

          <p style={{ fontSize: '0.75rem', color: '#8fa2bd', textAlign: 'center', marginTop: '0.5rem' }}>
            登録することで<a href="/legal/terms" style={{ color: '#d9b45b' }}>利用規約</a>および<a href="/legal/privacy" style={{ color: '#d9b45b' }}>プライバシーポリシー</a>に同意したものとみなされます。
          </p>
        </form>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080d16;
          color: #cfd8e6;
        }
        .auth-box {
          background: #101827;
          border: 1px solid #1f2e4d;
          border-radius: 12px;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }
        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem;
          text-align: center;
        }
        .auth-subtitle {
          text-align: center;
          font-size: 0.95rem;
          color: #8fa2bd;
          margin-bottom: 2rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .auth-label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        .auth-input {
          background: #16233a;
          border: 1px solid #233454;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus {
          border-color: #d9b45b;
        }
        .auth-error {
          background: rgba(220, 38, 38, 0.15);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }
      `}</style>
    </div>
  );
}
