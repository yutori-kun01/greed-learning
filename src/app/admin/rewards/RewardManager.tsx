'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createReward, deleteReward, updateReward, type RewardResult } from '@/actions/rewards';

type Reward = {
  id: string;
  icon: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  requiredCompletedCourses: number | null;
  requiredPoints: number | null;
  isHidden: boolean;
  isActive: boolean;
  sortOrder: number;
  claimCount: number;
};

const inputStyle: React.CSSProperties = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', marginTop: 6, boxSizing: 'border-box' };
const labelText: React.CSSProperties = { fontSize: 13, color: 'var(--text-2)', fontWeight: 600 };
const hint: React.CSSProperties = { fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: '4px 0 0' };
const smallBtn: React.CSSProperties = { padding: '5px 10px', fontSize: 12 };

function conditionText(r: Pick<Reward, 'requiredCompletedCourses' | 'requiredPoints'>) {
  const parts: string[] = [];
  if (r.requiredCompletedCourses) parts.push(`講座${r.requiredCompletedCourses}つ読了`);
  if (r.requiredPoints) parts.push(`${r.requiredPoints.toLocaleString()}pt`);
  return parts.length ? parts.join(' ＋ ') : '条件なし（全員）';
}

function RewardForm({ reward, onDone, submit }: { reward?: Reward; onDone: () => void; submit: (fd: FormData) => Promise<RewardResult> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const result = await submit(fd);
            if (!result.success) {
              alert(result.error);
              return;
            }
            onDone();
            router.refresh();
          } catch {
            alert('保存に失敗しました');
          }
        });
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, marginBottom: 14 }}>
        <label>
          <span style={labelText}>アイコン</span>
          <input name="icon" style={inputStyle} defaultValue={reward?.icon ?? '🎁'} maxLength={8} />
        </label>
        <label>
          <span style={labelText}>タイトル</span>
          <input name="title" required style={inputStyle} defaultValue={reward?.title ?? ''} placeholder="例: 個別相談30分無料チケット" maxLength={80} />
        </label>
      </div>

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={labelText}>説明（条件を満たす前から会員に見えます）</span>
        <textarea name="description" rows={2} style={{ ...inputStyle, resize: 'vertical' }} defaultValue={reward?.description ?? ''} placeholder="どんな特典か、ひとこと" />
      </label>

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={labelText}>獲得後に表示する内容</span>
        <textarea name="content" rows={3} style={{ ...inputStyle, resize: 'vertical' }} defaultValue={reward?.content ?? ''} placeholder="例: クーポンコード TAIDA-2026 / 申し込み方法など" />
        <p style={hint}>獲得した会員にだけ表示されます。それまでブラウザには送られません。</p>
      </label>

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={labelText}>獲得後のリンク（任意）</span>
        <input name="url" style={inputStyle} defaultValue={reward?.url ?? ''} placeholder="https://… または /courses/…" />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: 12, marginBottom: 6 }}>
        <label>
          <span style={labelText}>必要な読了講座数</span>
          <input type="number" name="requiredCompletedCourses" min={0} step={1} style={inputStyle} defaultValue={reward?.requiredCompletedCourses ?? ''} placeholder="空欄で条件なし" />
        </label>
        <label>
          <span style={labelText}>必要な累計ポイント</span>
          <input type="number" name="requiredPoints" min={0} step={1} style={inputStyle} defaultValue={reward?.requiredPoints ?? ''} placeholder="空欄で条件なし" />
        </label>
        <label>
          <span style={labelText}>表示順</span>
          <input type="number" name="sortOrder" step={1} style={inputStyle} defaultValue={reward?.sortOrder ?? 0} />
        </label>
      </div>
      <p style={{ ...hint, marginBottom: 14 }}>
        両方設定した場合は両方を満たす必要があります。ポイントは消費されず、累計が到達すれば獲得できます（ポイント交換所に表示）。
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" name="isActive" defaultChecked={reward?.isActive ?? true} /> 公開する
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" name="isHidden" defaultChecked={reward?.isHidden ?? false} /> 隠し特典（条件を満たすまで一覧に出さない）
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-gold" disabled={isPending}>{isPending ? '保存中...' : reward ? '変更を保存' : '追加する'}</button>
        {reward && <button type="button" className="btn btn-ghost" onClick={onDone}>キャンセル</button>}
      </div>
    </form>
  );
}

export default function RewardManager({ rewards, points }: { rewards: Reward[]; points: Record<string, number> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 className="section-title">特典・ポイント交換</h1>
      <div className="panel" style={{ marginBottom: 24, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
        会員は学習とログインでポイントを貯めます（消費されず累計のみ増えます）。
        <br />
        ・毎日のログイン <b style={{ color: 'var(--gold-2)' }}>+{points.DAILY_LOGIN}pt</b>
        ・レッスン完了 <b style={{ color: 'var(--gold-2)' }}>+{points.LESSON_COMPLETE}pt</b>
        ・講座読了ボーナス <b style={{ color: 'var(--gold-2)' }}>+{points.COURSE_COMPLETE}pt</b>
        ・連続学習の節目 <b style={{ color: 'var(--gold-2)' }}>+{points.STREAK_MILESTONE}pt</b>
        <br />
        ここで作った特典は、会員の「特典・ポイント」ページに並びます。講座そのものを段階的に開放したいときは、講座の編集画面の「解放条件」を使ってください。
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2 className="panel-title">新しい特典を追加</h2>
        <RewardForm key={formKey} onDone={() => setFormKey((k) => k + 1)} submit={createReward} />
      </div>

      <div className="panel" style={{ padding: 0 }}>
        {rewards.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>特典がありません</p>
        ) : (
          rewards.map((r, i) => (
            <div key={r.id} style={{ padding: '14px 16px', borderBottom: i < rewards.length - 1 ? '1px solid var(--line)' : 'none' }}>
              {editingId === r.id ? (
                <RewardForm reward={r} onDone={() => setEditingId(null)} submit={(fd) => updateReward(r.id, fd)} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: r.isActive ? 'var(--text)' : 'var(--muted)' }}>
                      {r.title}
                      {!r.isActive && <span className="tag" style={{ marginLeft: 8 }}>非公開</span>}
                      {r.isHidden && <span className="tag" style={{ marginLeft: 8 }}>👻 隠し</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      条件: {conditionText(r)} ・ 獲得 {r.claimCount}人
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost" style={smallBtn} disabled={isPending} onClick={() => setEditingId(r.id)}>編集</button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ ...smallBtn, color: '#ef4444' }}
                    disabled={isPending}
                    onClick={() => {
                      if (!confirm(`特典「${r.title}」を削除しますか？\n獲得済みの会員からも見えなくなります。`)) return;
                      startTransition(async () => {
                        await deleteReward(r.id);
                        router.refresh();
                      });
                    }}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
