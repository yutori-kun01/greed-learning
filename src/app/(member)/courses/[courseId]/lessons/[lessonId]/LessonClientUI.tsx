'use client';
import React, { useTransition, useState } from 'react';
import { toggleLessonComplete } from '@/actions/progress';
import RewardToast from '@/components/gamification/RewardToast';
import type { Reward } from '@/lib/gamification';

export default function LessonClientUI({ 
  lessonId, 
  initialCompleted,
  content,
  description
}: { 
  lessonId: string, 
  initialCompleted: boolean,
  content: string | null,
  description: string | null
}) {
  const [isPending, startTransition] = useTransition();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const newState = !isCompleted;
    setIsCompleted(newState); // Optimistic update
    setError(null);

    startTransition(async () => {
      try {
        const result = await toggleLessonComplete(lessonId, newState);
        // Only present the first time a lesson is completed; re-completing
        // awards nothing, so there is nothing to announce.
        if (result.reward) setReward(result.reward);
      } catch (err) {
        setIsCompleted(!newState); // Revert on failure
        setError((err as Error).message || 'エラーが発生しました');
      }
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
      {/* Left: Content */}
      <div className="panel" style={{ background: 'var(--panel)', padding: 32 }}>
        <h2 className="panel-title" style={{ fontSize: 18, marginBottom: 16 }}>レッスン概要</h2>
        {description && (
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            {description}
          </p>
        )}
        
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24 }}>
          {/* In a real app, this would be a TipTap or Markdown renderer */}
          <div 
            style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: content || '<p>テキストコンテンツはありません。</p>' }}
          />
        </div>
      </div>

      {/* Right: Sidebar / Controls */}
      <div>
        <div className="panel" style={{ position: 'sticky', top: 24 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text)', marginBottom: 16, fontWeight: 600 }}>進捗管理</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            このレッスンの学習が終わったら、完了マークをつけて次に進みましょう。
          </p>
          
          <button 
            onClick={handleToggle}
            disabled={isPending}
            className={`btn btn-block ${isCompleted ? 'btn-ghost' : 'btn-gold'}`}
            style={{ 
              fontWeight: 600,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: isCompleted ? '1px solid var(--gold)' : 'none',
              color: isCompleted ? 'var(--gold)' : undefined,
            }}
          >
            {isPending ? '更新中...' : (isCompleted ? '✅ 完了済み' : '完了マークをつける')}
          </button>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12, marginBottom: 0 }}>{error}</p>
          )}
        </div>
      </div>

      {reward && <RewardToast reward={reward} onDismiss={() => setReward(null)} />}
    </div>
  );
}
