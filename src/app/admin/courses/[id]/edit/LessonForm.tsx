'use client';

import React, { useState } from 'react';
import { createLesson } from '@/actions/lessons';

export default function LessonForm({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createLesson(courseId, formData);
      e.currentTarget.reset();
    } catch (err) {
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,0.07)', color: '#e9eef7', padding: '10px', borderRadius: '6px', marginBottom: '12px' };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="title" placeholder="レッスンタイトル" required style={inputStyle} />
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
