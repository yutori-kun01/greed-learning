'use client';

import React, { useState } from 'react';
import { createCourseResource } from '@/actions/resources';

export default function ResourceForm({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCourseResource(courseId, formData);
      e.currentTarget.reset();
    } catch (err) {
      alert('エラーが発生しました: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '10px', borderRadius: '6px', marginBottom: '12px' };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input type="text" name="icon" placeholder="絵文字" defaultValue="📄" style={{ ...inputStyle, width: 70, flex: 'none', textAlign: 'center' }} />
        <input type="text" name="title" placeholder="リソース名" required style={{ ...inputStyle, flex: 1 }} />
      </div>
      <textarea name="description" placeholder="説明 (任意)" rows={2} style={inputStyle} />
      <input type="text" name="fileUrl" placeholder="ダウンロードURL (任意)" style={inputStyle} />
      <button type="submit" disabled={loading} className="btn btn-gold btn-block">
        {loading ? '追加中...' : '追加する'}
      </button>
    </form>
  );
}
