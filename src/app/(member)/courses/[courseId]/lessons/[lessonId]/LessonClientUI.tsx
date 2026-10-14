'use client';
import React, { useRef, useTransition, useState } from 'react';
import type { VideoEmbed } from '@/lib/videoEmbed';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { toggleLessonComplete } from '@/actions/progress';
import RewardToast from '@/components/gamification/RewardToast';
import type { Reward } from '@/lib/gamification';
import type { Unlocked } from '@/lib/journeyState';

/** Share of the video a member must watch before marking the lesson complete. */
const REQUIRED_SHARE = 0.5;

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function LessonClientUI({
  lessonId,
  initialCompleted,
  content,
  description,
  title,
  embed,
  videoUrl,
  duration,
  skipWatchRule,
}: {
  lessonId: string,
  initialCompleted: boolean,
  content: string | null,
  description: string | null,
  title: string,
  embed: VideoEmbed | null,
  videoUrl: string | null,
  /** Video length in seconds; 0 when unknown (then nothing is required). */
  duration: number,
  /** Admins can mark lessons while checking them. */
  skipWatchRule: boolean,
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The rule needs a video we can follow and a known length.
  const required = embed && duration > 0 && !skipWatchRule ? Math.ceil(duration * REQUIRED_SHARE) : 0;
  const watched = useWatchProgress(lessonId, embed, iframeRef, required > 0 && !initialCompleted);
  const watchedEnough = watched >= required;
  const [isPending, startTransition] = useTransition();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [reward, setReward] = useState<Reward | null>(null);
  const [unlocked, setUnlocked] = useState<Unlocked | null>(null);
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
        if (result.reward) {
          setReward(result.reward);
          setUnlocked(result.unlocked);
        }
      } catch (err) {
        setIsCompleted(!newState); // Revert on failure
        setError((err as Error).message || 'エラーが発生しました');
      }
    });
  };

  return (
    <>
    {/* Video Player */}
    <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, background: '#000' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        {embed ? (
          <iframe
            ref={iframeRef}
            src={embed.src}
            title={title}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : videoUrl && /^https?:\/\//i.test(videoUrl) ? (
          // Not a provider we can frame: link out instead of a broken iframe.
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', padding: 24, textAlign: 'center' }}>
            <span>この動画はサイト内で再生できない形式です。</span>
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">動画を新しいタブで開く</a>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            動画が設定されていません
          </div>
        )}
      </div>
    </div>

    <div className="lesson-layout">
      {/* Left: Content */}
      <div className="panel lesson-body" style={{ background: 'var(--panel)' }}>
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
      <div className="lesson-side-col">
        <div className="panel lesson-side">
          <h3 style={{ fontSize: 14, color: 'var(--text)', marginBottom: 16, fontWeight: 600 }}>進捗管理</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            このレッスンの学習が終わったら、完了マークをつけて次に進みましょう。
          </p>
          
          {required > 0 && !isCompleted && (
            <div className="watch-gate">
              <div className="watch-gate-bar"><span style={{ width: `${Math.min(100, (watched / required) * 100)}%` }} /></div>
              <p>
                {watchedEnough
                  ? '動画を50%以上視聴しました。完了マークをつけられます。'
                  : `動画を半分（${formatTime(required)}）以上視聴すると完了マークをつけられます。視聴済み ${formatTime(Math.min(watched, required))}`}
              </p>
              {embed?.provider === 'loom' && !watchedEnough && (
                <p className="watch-gate-note">※Loom動画は再生状況を取得できないため、このページを開いている時間で判定しています。</p>
              )}
            </div>
          )}

          <button
            onClick={handleToggle}
            disabled={isPending || (!isCompleted && !watchedEnough)}
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

      {reward && <RewardToast reward={reward} unlocked={unlocked} onDismiss={() => setReward(null)} />}
    </div>
    </>
  );
}
