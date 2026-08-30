'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { updatePost } from '@/actions/posts';
import '@/components/editor/editor.css';

const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), { ssr: false, loading: () => (
  <div style={{ minHeight: 400, background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
    エディタを読み込み中...
  </div>
) });

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line)', borderRadius: '6px',
  padding: '10px 14px', color: 'var(--text)', fontSize: '13px',
  outline: 'none', marginTop: '6px', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '20px' };
const labelTextStyle: React.CSSProperties = { fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 };
const hintStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--muted)', marginTop: 4 };

const statusOptions = [
  { value: 'DRAFT', label: 'DRAFT — 下書き（非公開）', color: 'var(--muted)' },
  { value: 'PUBLISHED', label: 'PUBLISHED — 一般公開', color: '#6fd0a0' },
  { value: 'MEMBERS_ONLY', label: 'MEMBERS_ONLY — 無料会員以上', color: '#6495ed' },
  { value: 'PAID', label: 'PAID — 有料販売', color: 'var(--gold-2)' },
];

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  price: number | null;
};

export default function EditPostForm({ post }: { post: Post }) {
  const [status, setStatus] = useState(post.status);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [price, setPrice] = useState(post.price ? String(post.price) : '');
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const handleSave = useCallback(async (saveStatus?: string) => {
    if (!title || !slug) {
      alert('タイトルとスラッグは必須です');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('content', content);
      formData.append('status', saveStatus || status);
      formData.append('price', price);

      await updatePost(post.id, formData);
      router.push('/admin/posts');
      router.refresh();
    } catch (err) {
      alert('エラーが発生しました: ' + (err as Error).message);
      setSaving(false);
    }
  }, [title, slug, content, status, price, post.id, router]);

  const currentStatus = statusOptions.find(s => s.value === status);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="section-title" style={{ margin: 0 }}>記事の編集</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/posts" className="btn btn-ghost">キャンセル</Link>
          <button type="button" className="btn btn-gold" onClick={() => handleSave()} disabled={saving}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            <span style={labelTextStyle}>タイトル <span style={{ color: '#ef4444' }}>*</span></span>
            <input
              type="text" style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
              value={title} onChange={e => setTitle(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>スラッグ (URL)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>/posts/</span>
              <input
                type="text" style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                value={slug} onChange={e => setSlug(e.target.value)}
              />
            </div>
            <div style={hintStyle}>英数字とハイフンのみ。</div>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>公開ステータス</span>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {currentStatus && (
              <div style={{ ...hintStyle, color: currentStatus.color, fontWeight: 500 }}>
                ● {currentStatus.label.split('—')[1]?.trim()}
              </div>
            )}
          </label>

          {status === 'PAID' && (
            <label style={labelStyle}>
              <span style={labelTextStyle}>価格 (円) <span style={{ color: '#ef4444' }}>*</span></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>¥</span>
                <input type="number" style={{ ...inputStyle, marginTop: 0, flex: 1 }} value={price} onChange={e => setPrice(e.target.value)} min={0} step={100} />
              </div>
              <div style={hintStyle}>Stripeと連携後、実際の決済が有効になります。</div>
            </label>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, marginBottom: 8 }}>本文</div>
        <BlockEditor value={content} onChange={setContent} />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 40 }}>
        <Link href="/admin/posts" className="btn btn-ghost">キャンセル</Link>
        <button type="button" className="btn btn-gold" onClick={() => handleSave()} disabled={saving}>
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}
