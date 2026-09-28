'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCategory,
  deleteCategory,
  moveCategory,
  renameCategory,
  type CategoryResult,
} from '@/actions/categories';

type Category = { id: string; name: string; courseCount: number };

const inputStyle: React.CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
};
const smallBtn: React.CSSProperties = { padding: '5px 10px', fontSize: 12 };

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const run = (action: () => Promise<CategoryResult>, after?: () => void) => {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) {
          alert(result.error);
          return;
        }
        after?.();
        router.refresh();
      } catch {
        alert('操作に失敗しました');
      }
    });
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="section-title">カテゴリ管理</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
        講座一覧の絞り込みタブに、この順番で表示されます。カテゴリを削除すると、その講座は「未分類」になります（講座は消えません）。
      </p>

      <form
        className="panel"
        style={{ display: 'flex', gap: 8, marginBottom: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createCategory(newName), () => setNewName(''));
        }}
      >
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいカテゴリ名（例: AI活用、SNS運用）"
          maxLength={30}
        />
        <button type="submit" className="btn btn-gold" disabled={isPending || !newName.trim()}>
          追加
        </button>
      </form>

      <div className="panel" style={{ padding: 0 }}>
        {categories.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>カテゴリがありません</p>
        ) : (
          categories.map((c, i) => (
            <div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < categories.length - 1 ? '1px solid var(--line)' : 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button type="button" className="btn btn-ghost" style={{ padding: '0 6px', fontSize: 11 }} disabled={isPending || i === 0} onClick={() => run(() => moveCategory(c.id, 'up'))} aria-label="上へ">▲</button>
                <button type="button" className="btn btn-ghost" style={{ padding: '0 6px', fontSize: 11 }} disabled={isPending || i === categories.length - 1} onClick={() => run(() => moveCategory(c.id, 'down'))} aria-label="下へ">▼</button>
              </div>

              {editingId === c.id ? (
                <form
                  style={{ display: 'flex', gap: 8, flex: 1 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => renameCategory(c.id, editName), () => setEditingId(null));
                  }}
                >
                  <input style={{ ...inputStyle, flex: 1 }} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={30} autoFocus />
                  <button type="submit" className="btn btn-gold" style={smallBtn} disabled={isPending}>保存</button>
                  <button type="button" className="btn btn-ghost" style={smallBtn} onClick={() => setEditingId(null)}>キャンセル</button>
                </form>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.courseCount}講座</span>
                  <button type="button" className="btn btn-ghost" style={smallBtn} disabled={isPending} onClick={() => { setEditingId(c.id); setEditName(c.name); }}>
                    名前を変更
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ ...smallBtn, color: '#ef4444' }}
                    disabled={isPending}
                    onClick={() => {
                      const note = c.courseCount > 0 ? `\n${c.courseCount}件の講座は「未分類」になります。` : '';
                      if (confirm(`カテゴリ「${c.name}」を削除しますか？${note}`)) run(() => deleteCategory(c.id));
                    }}
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
