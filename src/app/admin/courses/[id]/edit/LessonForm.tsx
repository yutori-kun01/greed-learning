'use client';

import React, { useState } from 'react';
import { createLesson } from '@/actions/lessons';
import ImagePicker from '@/components/ImagePicker';

export default function LessonForm({ courseId, nextOrder }: { courseId: string; nextOrder: number }) {
  const [loading, setLoading] = useState(false);
  // Remounts the picker after a save, since form.reset() cannot clear its state.
  const [pickerKey, setPickerKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // React clears currentTarget once the handler yields, so reading it after
    // the await threw and reported a saved lesson as a failure.
    const form = e.currentTarget;
    try {
      await createLesson(courseId, new FormData(form));
      form.reset();
      setPickerKey((k) => k + 1);
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

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="title" placeholder="レッスンタイトル" required style={inputStyle} />
      <div style={{ marginBottom: 12 }}>
        <ImagePicker
          key={pickerKey}
          name="thumbnailUrl"
          purpose="thumbnail"
          shape="wide"
          hint="任意。未設定ならYouTube動画のサムネイル、それもなければ自動生成のカバーを使います。"
        />
      </div>
      <label style={labelStyle}>
        <span style={labelTextStyle}>動画URL（任意）</span>
        <input type="url" name="videoUrl" placeholder="https://www.loom.com/share/… / YouTube / Vimeo" style={inputStyle} />
        <span style={hintStyle}>Loom・YouTube・Vimeo の共有URLをそのまま貼り付けてください（埋め込み用URLへ自動で変換します）。</span>
      </label>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <label style={{ ...labelStyle, flex: '1 1 160px' }}>
          <span style={labelTextStyle}>表示順序</span>
          <input key={nextOrder} type="number" name="orderIndex" min={0} defaultValue={nextOrder} style={inputStyle} />
          <span style={hintStyle}>カリキュラムでの並び順です。小さい数字ほど上に表示されます（自動で最後尾の番号が入ります）。</span>
        </label>
        <div style={{ ...labelStyle, flex: '1 1 200px' }}>
          <span style={labelTextStyle}>動画の長さ（任意）</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" name="durationMinutes" min={0} placeholder="0" aria-label="動画の長さ（分）" style={{ ...inputStyle, marginBottom: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>分</span>
            <input type="number" name="durationSeconds" min={0} max={59} placeholder="0" aria-label="動画の長さ（秒）" style={{ ...inputStyle, marginBottom: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>秒</span>
          </div>
          <span style={hintStyle}>受講生画面のレッスン一覧と講座カードに「◯分」と表示されます。</span>
        </div>
      </div>
      <textarea name="content" placeholder="テキストコンテンツ (任意)" rows={4} style={inputStyle} />
      <button type="submit" disabled={loading} className="btn btn-gold btn-block">
        {loading ? '追加中...' : '追加する'}
      </button>
    </form>
  );
}
