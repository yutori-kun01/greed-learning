'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { claimReward } from '@/actions/rewards';
import type { MemberReward } from '@/lib/journeyState';

function progressOf(r: MemberReward): number {
  // The furthest-behind requirement decides how close the member is.
  const ratios = r.status.requirements.map((req) =>
    req.kind === 'course' ? (req.met ? 1 : 0) : Math.min(1, req.current / req.required)
  );
  return ratios.length ? Math.round(Math.min(...ratios) * 100) : 100;
}

function conditionText(r: MemberReward): string {
  return r.status.requirements
    .map((req) => {
      if (req.kind === 'points') return `${req.required.toLocaleString()}pt（現在 ${req.current.toLocaleString()}pt）`;
      if (req.kind === 'courses') return `講座${req.required}つ読了（現在 ${req.current}つ）`;
      return `「${req.title}」を読了`;
    })
    .join(' ＋ ');
}

function RewardCard({ reward }: { reward: MemberReward }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<{ content: string | null; url: string | null } | null>(
    reward.claimedAt ? { content: reward.content, url: reward.url } : null
  );
  const unlocked = reward.status.unlocked;
  const percent = progressOf(reward);

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: unlocked ? 1 : 0.55,
        borderColor: revealed ? 'rgba(217,180,91,0.45)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 30, filter: unlocked ? 'none' : 'grayscale(1)' }}>{reward.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{reward.title}</div>
          {reward.description && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>{reward.description}</div>}
        </div>
      </div>

      {reward.status.requirements.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 6 }}>
            {unlocked ? '✓ ' : '🔒 '}{conditionText(reward)}
          </div>
          {!unlocked && (
            <div className="progress">
              <span className="bar"><span style={{ width: `${percent}%` }}></span></span>
              <b>{percent}%</b>
            </div>
          )}
        </div>
      )}

      {revealed ? (
        <div style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold-2)', fontWeight: 700, marginBottom: 4 }}>🎉 獲得済み</div>
          {revealed.content && (
            <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.7, wordBreak: 'break-all' }}>{revealed.content}</div>
          )}
          {revealed.url && (
            <a href={revealed.url} target={revealed.url.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12, padding: '6px 12px' }}>
              特典を開く →
            </a>
          )}
        </div>
      ) : unlocked ? (
        <button
          type="button"
          className="btn btn-gold btn-block"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await claimReward(reward.id);
              if (!result.success) {
                alert(result.error);
                return;
              }
              setRevealed({ content: result.content, url: result.url });
              router.refresh();
            })
          }
        >
          {isPending ? '獲得中...' : '獲得する'}
        </button>
      ) : null}
    </div>
  );
}

export default function RewardsClientUI({ rewards }: { rewards: MemberReward[] }) {
  const shop = rewards.filter((r) => r.requiredPoints);
  const perks = rewards.filter((r) => !r.requiredPoints);

  if (rewards.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>
        特典は準備中です。ポイントを貯めてお待ちください。
      </div>
    );
  }

  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 };

  return (
    <>
      {perks.length > 0 && (
        <div>
          <h2 className="section-title">達成特典<span>（講座を読了して開放）</span></h2>
          <div style={grid}>{perks.map((r) => <RewardCard key={r.id} reward={r} />)}</div>
        </div>
      )}
      {shop.length > 0 && (
        <div>
          <h2 className="section-title">ポイント交換所<span>（累計ポイントで獲得・ポイントは減りません）</span></h2>
          <div style={grid}>{shop.map((r) => <RewardCard key={r.id} reward={r} />)}</div>
        </div>
      )}
    </>
  );
}
