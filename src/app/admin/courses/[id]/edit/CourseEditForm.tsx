'use client';
import React, { useState } from 'react';
import { updateCourse } from '@/actions/courses';

export default function CourseEditForm({ course }: { course: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      await updateCourse(course.id, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,0.07)', color: '#e9eef7', padding: '10px', borderRadius: '6px' };
  const labelStyle = { display: 'block', marginBottom: '8px', color: '#b6c1d2', fontSize: '13px' };

  return (
    <form onSubmit={handleSubmit} className="panel">
      <h2 className="panel-title">基本情報編集</h2>
      
      {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
      {success && <div style={{ color: '#22c55e', marginBottom: '16px', fontSize: '13px' }}>保存しました</div>}

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>タイトル</label>
        <input name="title" type="text" defaultValue={course.title} required style={inputStyle} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>管理番号 (number)</label>
        <input name="number" type="text" defaultValue={course.number} required style={inputStyle} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>説明</label>
        <textarea name="description" defaultValue={course.description || ''} rows={4} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>カテゴリー</label>
        <select name="categoryId" defaultValue={course.categoryId || ''} style={inputStyle}>
          <option value="">なし</option>
          <option value="MARKETING">マーケティング</option>
          <option value="DESIGN">デザイン</option>
          <option value="TECH">テクノロジー</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>ステータス</label>
        <select name="status" defaultValue={course.status} style={inputStyle}>
          <option value="DRAFT">下書き (DRAFT)</option>
          <option value="PUBLISHED">公開 (PUBLISHED)</option>
          <option value="ARCHIVED">アーカイブ (ARCHIVED)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>バッジテキスト（例: NEW, UPDATE）</label>
        <input name="badge" type="text" defaultValue={course.badge || ''} style={inputStyle} />
      </div>

      <button type="submit" className="btn btn-gold" disabled={loading}>
        {loading ? '保存中...' : '変更を保存'}
      </button>
    </form>
  );
}
