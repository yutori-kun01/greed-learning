import { BADGES } from '@/lib/points';
import type { EarnedBadge } from '@/lib/gamification';

/**
 * Shows every badge, earned or not. The locked ones are the point: they tell
 * a member what is worth doing next, which an "earned only" list cannot.
 */
export default function BadgeShelf({ earned }: { earned: EarnedBadge[] }) {
  const earnedById = new Map(earned.map((b) => [b.id, b]));

  return (
    <div>
      <h2 className="section-title">
        バッジ{' '}
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>
          {earned.length} / {BADGES.length}
        </span>
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {BADGES.map((badge) => {
          const held = earnedById.get(badge.id);
          return (
            <div
              key={badge.id}
              className="panel"
              style={{
                padding: '16px 14px',
                textAlign: 'center',
                opacity: held ? 1 : 0.4,
                borderColor: held ? 'rgba(217,180,91,0.4)' : undefined,
              }}
              title={badge.description}
            >
              <div style={{ fontSize: 28, marginBottom: 8, filter: held ? 'none' : 'grayscale(1)' }}>
                {badge.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {badge.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                {badge.description}
              </div>
              {held && (
                <div style={{ fontSize: 10, color: 'var(--gold-2)', marginTop: 8 }}>
                  {new Date(held.earnedAt).toLocaleDateString('ja-JP')} 獲得
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
