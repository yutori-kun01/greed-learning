import type { GamificationSummary } from '@/lib/gamification';

export default function LevelCard({ summary }: { summary: GamificationSummary }) {
  const { level, totalPoints } = summary;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>LEVEL</span>
          <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
            {level.level}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 13, color: 'var(--text-2)' }}>
          <div>
            <strong style={{ color: 'var(--text)', fontSize: 16 }}>{totalPoints.toLocaleString()}</strong> pt
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
            次のレベルまで あと {level.pointsToNextLevel.toLocaleString()} pt
          </div>
        </div>
      </div>

      <div>
        <div className="progress">
          <div className="bar">
            <span style={{ width: `${level.progressPercent}%` }}></span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{level.levelStartedAt.toLocaleString()} pt</span>
          <span>{level.nextLevelAt.toLocaleString()} pt</span>
        </div>
      </div>
    </div>
  );
}
