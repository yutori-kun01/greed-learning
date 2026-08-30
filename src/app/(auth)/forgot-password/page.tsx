'use client';
import React, { useState } from 'react';
import { requestPasswordReset } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message || '送信に失敗しました');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">パスワード再設定</h1>
        <p className="auth-subtitle">ご登録のメールアドレスに再設定用のリンクをお送りします</p>

        {sent ? (
          <div style={{ background: 'rgba(217,180,91,.1)', color: '#f2d992', padding: '0.75rem 1rem', borderRadius: 6, fontSize: '0.9rem', textAlign: 'center' }}>
            メールを送信しました。届いたリンクからパスワードを再設定してください。
          </div>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
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
              <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
                {loading ? '送信中...' : '再設定リンクを送信'}
              </button>
            </form>
          </>
        )}

        <p style={{ fontSize: '0.85rem', color: '#8fa2bd', textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/login" style={{ color: '#d9b45b' }}>ログイン画面に戻る</a>
        </p>
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
          font-size: 0.9rem;
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
