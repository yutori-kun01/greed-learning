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
    <div className="auth-box">
      <h1 className="auth-title">パスワード再設定</h1>
      <p className="auth-subtitle">ご登録のメールアドレスに再設定用のリンクをお送りします</p>

      {sent ? (
        <div className="auth-success">
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

      <p className="auth-note">
        <a href="/login">ログイン画面に戻る</a>
      </p>
    </div>
  );
}
