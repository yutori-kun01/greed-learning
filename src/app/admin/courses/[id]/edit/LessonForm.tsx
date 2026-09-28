'use client';

import React, { useState } from 'react';
import { createLesson } from '@/actions/lessons';
import ImagePicker from '@/components/ImagePicker';

export default function LessonForm({ courseId }: { courseId: string }) {
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

  const inputStyle = { width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '10px', borderRadius: '6px', marginBottom: '12px' };

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
      <input type="text" name="videoUrl" placeholder="Vimeo/YouTube URL (任意)" style={inputStyle} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <input type="number" name="orderIndex" placeholder="表示順序" defaultValue={0} style={{ ...inputStyle, flex: 1 }} />
        <input type="number" name="duration" placeholder="動画の長さ(秒)" defaultValue={0} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <textarea name="content" placeholder="テキストコンテンツ (任意)" rows={4} style={inputStyle} />
      <button type="submit" disabled={loading} className="btn btn-gold btn-block">
        {loading ? '追加中...' : '追加する'}
      </button>
    </form>
  );
}
