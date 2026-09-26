'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/auth-client';

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(new URLSearchParams(window.location.search).get('token'));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('無効なリンクです。もう一度パスワード再設定をリクエストしてください。');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);
    const res = await resetPassword({ newPassword: password, token });
    setLoading(false);

    if (res.error) {
      setError(res.error.message || 'パスワードの再設定に失敗しました');
    } else {
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">新しいパスワードを設定</h1>

      {done ? (
        <div className="auth-success">
          パスワードを更新しました。ログイン画面に移動します...
        </div>
      ) : (
        <>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              <span>新しいパスワード</span>
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="auth-label">
              <span>新しいパスワード（確認）</span>
              <input
                type="password"
                className="auth-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
              {loading ? '更新中...' : 'パスワードを更新'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
