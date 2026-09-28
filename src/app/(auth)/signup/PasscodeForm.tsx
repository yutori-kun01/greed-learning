'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enterSignupPasscode } from '@/actions/signup';
import { useTurnstile } from '@/components/Turnstile';

export default function PasscodeForm() {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstile.required && !turnstile.token) {
      setError('ボット対策のチェックを完了してください。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await enterSignupPasscode(passcode, turnstile.token);
      if (result.ok) {
        // The pass cookie is set; re-render the page, which now shows the form.
        router.refresh();
        return;
      }
      setError(result.error);
    } catch {
      setError('確認に失敗しました。時間をおいて再度お試しください。');
    }
    setLoading(false);
    turnstile.reset();
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">会員登録</h1>
        <p className="auth-subtitle">案内されたパスコードを入力してください</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            <span>パスコード</span>
            <input
              type="password"
              className="auth-input"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoComplete="off"
              required
            />
          </label>

          {turnstile.widget}

          <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
            {loading ? '確認中...' : '次へ'}
          </button>
        </form>

        <p className="auth-foot">
          すでにアカウントをお持ちの方は <a href="/login" className="auth-link">ログイン</a>
        </p>
      </div>
    </div>
  );
}
