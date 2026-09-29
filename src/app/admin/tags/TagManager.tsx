'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTag, deleteTag, renameTag, type TagResult } from '@/actions/tags';

type Tag = { id: string; name: string; courseCount: number };

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

export default function TagManager({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const run = (action: () => Promise<TagResult>, after?: () => void) => {
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
      <h1 className="section-title">タグ管理</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
        カテゴリは1講座に1つですが、タグは1講座にいくつでも付けられます。会員は講座一覧でタグをクリックして絞り込んだり、キーワード検索でタグ名からも講座を探せます。タグは講座の編集画面で付けます。
      </p>

      <form
        className="panel"
        style={{ display: 'flex', gap: 8, marginBottom: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createTag(newName), () => setNewName(''));
        }}
      >
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいタグ名（例: 初心者向け、ChatGPT、30分で完了）"
          maxLength={20}
        />
        <button type="submit" className="btn btn-gold" disabled={isPending || !newName.trim()}>
          追加
        </button>
      </form>

      <div className="panel" style={{ padding: 0 }}>
        {tags.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>タグがありません</p>
        ) : (
          tags.map((t, i) => (
            <div
              key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < tags.length - 1 ? '1px solid var(--line)' : 'none' }}
            >
              {editingId === t.id ? (
                <form
                  style={{ display: 'flex', gap: 8, flex: 1 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => renameTag(t.id, editName), () => setEditingId(null));
                  }}
                >
                  <input style={{ ...inputStyle, flex: 1 }} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={20} autoFocus />
                  <button type="submit" className="btn btn-gold" style={smallBtn} disabled={isPending}>保存</button>
                  <button type="button" className="btn btn-ghost" style={smallBtn} onClick={() => setEditingId(null)}>キャンセル</button>
                </form>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>#{t.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.courseCount}講座</span>
                  <button type="button" className="btn btn-ghost" style={smallBtn} disabled={isPending} onClick={() => { setEditingId(t.id); setEditName(t.name); }}>
                    名前を変更
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ ...smallBtn, color: '#ef4444' }}
                    disabled={isPending}
                    onClick={() => {
                      const note = t.courseCount > 0 ? `\n${t.courseCount}件の講座からこのタグが外れます（講座は消えません）。` : '';
                      if (confirm(`タグ「${t.name}」を削除しますか？${note}`)) run(() => deleteTag(t.id));
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
