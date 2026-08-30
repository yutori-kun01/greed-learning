'use client';
import { useTransition } from 'react';
import { togglePlanActive, deletePlan } from '@/actions/plans';

export default function PlanRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await togglePlanActive(id, !isActive);
      } catch (err) {
        alert('エラーが発生しました: ' + (err as Error).message);
      }
    });
  };

  const handleDelete = () => {
    if (confirm('本当に削除しますか？契約中の会員がいる場合は先にプランを無効化してください。')) {
      startTransition(async () => {
        try {
          await deletePlan(id);
        } catch (err) {
          alert('エラーが発生しました: ' + (err as Error).message);
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={handleToggle} disabled={isPending}>
        {isActive ? '無効化' : '有効化'}
      </button>
      <button
        style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '12px' }}
        onClick={handleDelete}
        disabled={isPending}
      >
        削除
      </button>
    </div>
  );
}
