'use client';

import React, { useRef, useState } from 'react';
import { createLesson, lookupVideoDuration, updateLesson } from '@/actions/lessons';
import ImagePicker from '@/components/ImagePicker';
import { videoEmbed } from '@/lib/videoEmbed';
import { youtubeVideoId } from '@/lib/thumbnails';
import { loadYoutubeApi, type YTGlobal, type YTPlayer } from '@/lib/youtubeApi';

export type EditableLesson = {
  id: string;
  title: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  content: string | null;
  duration: number | null;
  sortOrder: number;
};

type LookupState = 'idle' | 'loading' | 'done' | 'failed';

/**
 * Adds a lesson, or edits one when `lesson` is given.
 *
 * 表示順序 left blank goes to the end of the list (editing: stays put).
 * 動画の長さ is looked up from the video as soon as a URL is pasted; it can
 * still be typed or corrected by hand.
 */
export default function LessonForm({
  courseId,
  nextOrder,
  lesson,
  onDone,
}: {
  courseId: string;
  nextOrder: number;
  lesson?: EditableLesson;
  onDone?: () => void;
}) {
  const editing = Boolean(lesson);
  const [loading, setLoading] = useState(false);
  // Remounts the picker after a save, since form.reset() cannot clear its state.
  const [pickerKey, setPickerKey] = useState(0);
  const initial = lesson?.duration ?? 0;
  const [minutes, setMinutes] = useState(initial > 0 ? String(Math.floor(initial / 60)) : '');
  const [seconds, setSeconds] = useState(initial > 0 ? String(initial % 60) : '');
  const [lookup, setLookup] = useState<LookupState>('idle');
  // The URL whose length is in the boxes, so the same URL is not looked up twice.
  const lookedUp = useRef(initial > 0 ? lesson?.videoUrl ?? '' : '');

  const fillDuration = async (url: string, force = false) => {
    const trimmed = url.trim();
    if (!trimmed || !videoEmbed(trimmed)) {
      setLookup('idle');
      return;
    }
    if (!force && trimmed === lookedUp.current) return;
    lookedUp.current = trimmed;
    setLookup('loading');
    let total: number | null = null;
    try {
      total = (await lookupVideoDuration(trimmed)).seconds;
    } catch {
      total = null;
    }
    // YouTube can turn the server away; the player in this browser still knows.
    if (total == null) {
      const id = youtubeVideoId(trimmed);
      if (id) total = await youtubeDurationInBrowser(id);
    }
    if (total == null) {
      setLookup('failed');
      return;
    }
    setMinutes(String(Math.floor(total / 60)));
    setSeconds(String(total % 60));
    setLookup('done');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // React clears currentTarget once the handler yields, so reading it after
    // the await threw and reported a saved lesson as a failure.
    const form = e.currentTarget;
    try {
      if (lesson) {
        await updateLesson(lesson.id, courseId, new FormData(form));
        onDone?.();
      } else {
        await createLesson(courseId, new FormData(form));
        form.reset();
        setPickerKey((k) => k + 1);
        setMinutes('');
        setSeconds('');
        setLookup('idle');
        lookedUp.current = '';
      }
    } catch (err) {
      alert('エラーが発生しました: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '10px', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', marginBottom: '12px' };
  const labelTextStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' };
  const hintStyle = { display: 'block', fontSize: '11px', color: 'var(--muted)', marginTop: '-6px', lineHeight: 1.5 };

  const lookupNote: Record<LookupState, string> = {
    idle: '動画URLを入れると自動で取得します。手入力・修正もできます。',
    loading: '動画の長さを取得中…',
    done: '動画から自動取得しました。必要なら修正してください。',
    failed: '自動取得できませんでした。お手数ですが手入力してください。',
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>
        <span style={labelTextStyle}>レッスンタイトル</span>
        <input type="text" name="title" placeholder="レッスンタイトル" required defaultValue={lesson?.title} style={inputStyle} />
      </label>
      <div style={{ marginBottom: 12 }}>
        <ImagePicker
          key={pickerKey}
          name="thumbnailUrl"
          purpose="thumbnail"
          shape="wide"
          initialUrl={lesson?.thumbnailUrl}
          hint="任意。未設定ならYouTube動画のサムネイル、それもなければ自動生成のカバーを使います。"
        />
      </div>
      <label style={labelStyle}>
        <span style={labelTextStyle}>動画URL（任意）</span>
        <input
          type="url"
          name="videoUrl"
          placeholder="https://www.loom.com/share/… / YouTube / Vimeo"
          defaultValue={lesson?.videoUrl ?? ''}
          onBlur={(e) => fillDuration(e.currentTarget.value)}
          onPaste={(e) => {
            const input = e.currentTarget;
            // The pasted text lands after this handler; read it on the next tick.
            setTimeout(() => fillDuration(input.value), 0);
          }}
          style={inputStyle}
        />
        <span style={hintStyle}>Loom・YouTube・Vimeo の共有URLをそのまま貼り付けてください（埋め込み用URLへ自動で変換します）。</span>
      </label>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <label style={{ ...labelStyle, flex: '1 1 160px' }}>
          <span style={labelTextStyle}>表示順序（任意）</span>
          <input
            key={nextOrder}
            type="number"
            name="orderIndex"
            min={0}
            defaultValue={lesson ? lesson.sortOrder : ''}
            placeholder={editing ? '' : `自動（${nextOrder}）`}
            style={inputStyle}
          />
          <span style={hintStyle}>
            {editing
              ? '小さい数字ほど上に表示されます。空欄にすると今の位置のままです。'
              : '空欄なら自動で一番最後に追加されます。順番を指定したいときだけ入力してください（小さい数字ほど上）。'}
          </span>
        </label>
        <div style={{ ...labelStyle, flex: '1 1 200px' }}>
          <span style={labelTextStyle}>動画の長さ（自動取得）</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" name="durationMinutes" min={0} placeholder="0" aria-label="動画の長さ（分）" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>分</span>
            <input type="number" name="durationSeconds" min={0} max={59} placeholder="0" aria-label="動画の長さ（秒）" value={seconds} onChange={(e) => setSeconds(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>秒</span>
          </div>
          <span style={{ ...hintStyle, marginTop: 6, color: lookup === 'failed' ? '#ef4444' : 'var(--muted)' }}>{lookupNote[lookup]}</span>
        </div>
      </div>
      <label style={labelStyle}>
        <span style={labelTextStyle}>テキストコンテンツ（任意）</span>
        <textarea name="content" placeholder="テキストコンテンツ (任意)" rows={4} defaultValue={lesson?.content ?? ''} style={inputStyle} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        {editing && (
          <button type="button" className="btn btn-block" onClick={onDone} disabled={loading}>
            キャンセル
          </button>
        )}
        <button type="submit" disabled={loading || lookup === 'loading'} className="btn btn-gold btn-block">
          {loading ? '保存中...' : editing ? '変更を保存' : '追加する'}
        </button>
      </div>
    </form>
  );
}

/** Asks an off-screen YouTube player for the video's length. */
async function youtubeDurationInBrowser(videoId: string): Promise<number | null> {
  let api: YTGlobal;
  try {
    api = await loadYoutubeApi();
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:120px;';
    const target = document.createElement('div');
    host.appendChild(target);
    document.body.appendChild(host);
    let player: YTPlayer | null = null;
    const finish = (value: number | null) => {
      clearTimeout(timer);
      try { player?.destroy(); } catch { /* already gone */ }
      host.remove();
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 10000);
    player = new api.Player(target, {
      videoId,
      events: {
        onReady: (e: { target: YTPlayer }) => {
          const length = Math.round(e.target.getDuration());
          finish(length > 0 ? length : null);
        },
        onError: () => finish(null),
      },
    });
  });
}
