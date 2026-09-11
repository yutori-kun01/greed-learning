'use client';

import { useEffect, useState } from 'react';
import type { Reward } from '@/lib/gamification';

/**
 * Shown once, right after a lesson is first completed. The award happens
 * server-side either way; this is what tells the member it happened.
 */
export default function RewardToast({
  reward,
  onDismiss,
}: {
  reward: Reward;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hold = reward.newBadges.length > 0 || reward.leveledUp ? 7000 : 4000;
    const timer = setTimeout(() => setLeaving(true), hold);
    return () => clearTimeout(timer);
  }, [reward]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onDismiss, 250);
    return () => clearTimeout(timer);
  }, [leaving, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 60,
        width: 300,
        maxWidth: 'calc(100vw - 48px)',
        background: 'var(--panel)',
        border: '1px solid rgba(217,180,91,0.45)',
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity .25s ease, transform .25s ease',
      }}
    >
      <button
        onClick={() => setLeaving(true)}
        aria-label="閉じる"
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          background: 'transparent',
          border: 'none',
          color: 'var(--muted)',
          fontSize: 16,
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>

      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        +{reward.pointsAwarded} pt
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        合計 {reward.totalPoints.toLocaleString()} pt
      </div>

      {reward.courseCompleted && (
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>
          🎯 講座を完走しました
        </div>
      )}

      {reward.leveledUp && (
        <div style={{ fontSize: 13, color: 'var(--gold-2)', fontWeight: 600, marginBottom: 8 }}>
          ⬆️ レベル {reward.level.level} に上がりました
        </div>
      )}

      {reward.streakAdvanced && reward.currentStreak > 1 && (
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
          🔥 {reward.currentStreak}日連続
        </div>
      )}

      {reward.newBadges.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>バッジ獲得</div>
          {reward.newBadges.map((badge) => (
            <div key={badge.id} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
              {badge.icon} {badge.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
