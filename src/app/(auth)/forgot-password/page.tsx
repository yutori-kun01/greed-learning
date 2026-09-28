'use client';
import React, { useState } from 'react';
import { requestPasswordReset } from '@/lib/auth-client';
import { useTurnstile } from '@/components/Turnstile';
import { authErrorMessage } from '@/lib/authErrors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstile.required && !turnstile.token) {
      setError('ボット対策のチェックを完了してください。');
      return;
    }
    setLoading(true);
    setError('');

    const res = await requestPasswordReset({
      email,
      redirectTo: '/reset-password',
      fetchOptions: { headers: turnstile.headers },
    });

    setLoading(false);
    if (res.error) {
      setError(authErrorMessage(res.error, '送信に失敗しました'));
      turnstile.reset();
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
          <div className="auth-notice">
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
              {turnstile.widget}

              <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
                {loading ? '送信中...' : '再設定リンクを送信'}
              </button>
            </form>
          </>
        )}

        <p className="auth-foot">
          <a href="/login" className="auth-link">ログイン画面に戻る</a>
        </p>
      </div>
    </div>
  );
}
