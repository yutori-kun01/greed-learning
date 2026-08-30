'use client';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCourse } from '@/actions/courses';

const inputStyle: React.CSSProperties = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '16px' };

type Course = {
  id: string;
  number: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  status: string;
  badge: string | null;
  requiredPlanId: string | null;
};

type Plan = { id: string; name: string };

export default function CourseInfoForm({ course, plans = [] }: { course: Course; plans?: Plan[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateCourse(course.id, formData);
        setSaved(true);
        router.refresh();
      } catch (err) {
        alert('エラーが発生しました: ' + (err as Error).message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>講座番号</span>
        <input type="text" name="number" required style={inputStyle} defaultValue={course.number} />
      </label>

      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>タイトル</span>
        <input type="text" name="title" required style={inputStyle} defaultValue={course.title} />
      </label>

      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>説明</span>
        <textarea name="description" rows={4} style={{ ...inputStyle, resize: 'vertical' }} defaultValue={course.description || ''} />
      </label>

      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>カテゴリ</span>
        <select name="categoryId" style={inputStyle} defaultValue={course.categoryId || 'strategy'}>
          <option value="strategy">strategy</option>
          <option value="traffic">traffic</option>
          <option value="content">content</option>
        </select>
      </label>

      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>ステータス</span>
        <select name="status" style={inputStyle} defaultValue={course.status}>
          <option value="DRAFT">DRAFT (下書き)</option>
          <option value="PUBLISHED">PUBLISHED (公開)</option>
          <option value="ARCHIVED">ARCHIVED (アーカイブ)</option>
        </select>
      </label>

      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>バッジ (任意)</span>
        <input type="text" name="badge" style={inputStyle} defaultValue={course.badge || ''} placeholder="例: NEW, 人気" />
      </label>

      <label style={labelStyle}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>公開範囲</span>
        <select name="requiredPlanId" style={inputStyle} defaultValue={course.requiredPlanId || ''}>
          <option value="">全ての有料会員に公開</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>{plan.name} 会員限定</option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" disabled={isPending} className="btn btn-gold">
          {isPending ? '保存中...' : '変更を保存'}
        </button>
        {saved && !isPending && <span style={{ color: '#8ce0a8', fontSize: '13px' }}>保存しました</span>}
      </div>
    </form>
  );
}
