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
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">新しいパスワードを設定</h1>

        {done ? (
          <div style={{ background: 'rgba(111,208,160,.15)', color: '#8ce0a8', padding: '0.75rem 1rem', borderRadius: 6, fontSize: '0.9rem', textAlign: 'center' }}>
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
          margin: 0 0 2rem;
          text-align: center;
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
