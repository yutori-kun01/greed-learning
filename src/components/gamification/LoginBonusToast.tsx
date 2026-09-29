'use client';

import { useEffect, useState } from 'react';

/** Tells the member the day's login bonus was paid. Shown once per day. */
export default function LoginBonusToast({ points, totalPoints }: { points: number; totalPoints: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 60,
        width: 280,
        maxWidth: 'calc(100vw - 48px)',
        background: 'var(--panel)',
        border: '1px solid rgba(217,180,91,0.45)',
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      }}
    >
      <button
        onClick={() => setVisible(false)}
        aria-label="閉じる"
        style={{ position: 'absolute', top: 8, right: 10, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
      >
        ×
      </button>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>🌅 今日のログインボーナス</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>+{points} pt</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>累計 {totalPoints.toLocaleString()} pt</div>
    </div>
  );
}
