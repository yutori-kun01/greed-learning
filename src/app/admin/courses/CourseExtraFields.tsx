'use client';
import React from 'react';
import Link from 'next/link';

const inputStyle: React.CSSProperties = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' };
const labelText: React.CSSProperties = { fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 };
const hint: React.CSSProperties = { fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: '4px 0 0' };

type Option = { id: string; name: string };

/** Tag checkboxes, posted as repeated `tagIds`. */
export function TagFields({ tags, selected = [] }: { tags: Option[]; selected?: string[] }) {
  const initial = new Set(selected);
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={labelText}>タグ（複数選択可）</span>
      {tags.length === 0 ? (
        <p style={hint}>
          タグがまだありません。<Link href="/admin/tags" style={{ color: 'var(--gold-2)' }}>タグ管理</Link>で作成できます。
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {tags.map((t) => (
              <label key={t.id} className="tag-check">
                <input type="checkbox" name="tagIds" value={t.id} defaultChecked={initial.has(t.id)} />
                <span>#{t.name}</span>
              </label>
            ))}
          </div>
          <p style={hint}>
            会員は講座一覧でタグから絞り込み・検索できます。<Link href="/admin/tags" style={{ color: 'var(--gold-2)' }}>タグを追加・編集</Link>
          </p>
        </>
      )}
    </div>
  );
}

type Journey = {
  prerequisiteIds?: string[];
  unlockCompletedCourses?: number | null;
  unlockPoints?: number | null;
  isHidden?: boolean;
};

/**
 * Unlock rules for the customer journey. Every condition set here must be
 * met, on top of the course's 公開範囲 (plan).
 */
export function JourneyFields({
  courses,
  value = {},
}: {
  courses: Array<{ id: string; number: string; title: string }>;
  value?: Journey;
}) {
  const selected = new Set(value.prerequisiteIds ?? []);
  return (
    <fieldset style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px 4px', margin: '0 0 20px' }}>
      <legend style={{ ...labelText, padding: '0 6px', color: 'var(--gold-2)' }}>🗺️ 解放条件（カスタマージャーニー）</legend>
      <p style={{ ...hint, marginBottom: 14 }}>
        設定した条件をすべて満たすまで、この講座は講座一覧でグレーアウトされ開けません。何も設定しなければ最初から開放されています。
      </p>

      <div style={{ marginBottom: 16 }}>
        <span style={labelText}>前提講座（読了すると開放）</span>
        {courses.length === 0 ? (
          <p style={hint}>ほかの講座がありません。</p>
        ) : (
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', marginTop: 6, background: 'var(--panel-2)' }}>
            {courses.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" name="prerequisiteIds" value={c.id} defaultChecked={selected.has(c.id)} />
                {c.number ? `${c.number}. ` : ''}{c.title}
              </label>
            ))}
          </div>
        )}
        <p style={hint}>「読了」は、その講座のレッスンをすべて完了した状態です（レッスンが0件の講座は読了できません）。</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <label>
          <span style={labelText}>読了講座数で開放</span>
          <input type="number" name="unlockCompletedCourses" min={0} step={1} style={inputStyle} defaultValue={value.unlockCompletedCourses ?? ''} placeholder="例: 3（空欄で条件なし）" />
        </label>
        <label>
          <span style={labelText}>累計ポイントで開放</span>
          <input type="number" name="unlockPoints" min={0} step={1} style={inputStyle} defaultValue={value.unlockPoints ?? ''} placeholder="例: 1000（空欄で条件なし）" />
        </label>
      </div>
      <p style={{ ...hint, marginTop: -8, marginBottom: 16 }}>ポイントは消費されません。累計が到達した時点で開放され、その後も開放されたままです。</p>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
        <input type="checkbox" name="isHidden" defaultChecked={value.isHidden ?? false} style={{ marginTop: 3 }} />
        <span>
          <span style={labelText}>隠し講座にする</span>
          <span style={{ ...hint, display: 'block', margin: 0 }}>条件を満たすまで講座一覧に表示せず、存在も見せません。条件を設定していない場合は通常どおり表示されます。</span>
        </span>
      </label>
    </fieldset>
  );
}
