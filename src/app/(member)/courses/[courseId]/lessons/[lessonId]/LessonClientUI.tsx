'use client';
import React, { useTransition, useState } from 'react';
import { toggleLessonComplete } from '@/actions/progress';

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

  const handleToggle = () => {
    const newState = !isCompleted;
    setIsCompleted(newState); // Optimistic update
    
    startTransition(async () => {
      try {
        await toggleLessonComplete(lessonId, newState);
      } catch (err) {
        setIsCompleted(!newState); // Revert on failure
        alert('エラーが発生しました');
      }
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
      {/* Left: Content */}
      <div className="panel" style={{ background: 'var(--panel)', padding: 32 }}>
        <h2 className="panel-title" style={{ fontSize: 18, marginBottom: 16 }}>レッスン概要</h2>
        {description && (
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
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
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
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
              color: isCompleted ? 'var(--gold)' : '#fff'
            }}
          >
            {isPending ? '更新中...' : (isCompleted ? '✅ 完了済み' : '完了マークをつける')}
          </button>
        </div>
      </div>
    </div>
  );
}
