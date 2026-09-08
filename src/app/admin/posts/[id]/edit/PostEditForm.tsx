'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import '@/components/editor/editor.css';
import { updatePost } from '@/actions/posts';

// Dynamic import to avoid SSR issues with TipTap
const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), { ssr: false, loading: () => (
  <div style={{ minHeight: 400, background: '#0c1526', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7d8b9f', fontSize: 13 }}>
    エディタを読み込み中...
  </div>
) });

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', background: '#101d31',
  border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px',
  padding: '10px 14px', color: '#e9eef7', fontSize: '13px',
  outline: 'none', marginTop: '6px', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '20px' };
const labelTextStyle: React.CSSProperties = { fontSize: '13px', color: '#b6c1d2', fontWeight: 600 };
const hintStyle: React.CSSProperties = { fontSize: '11px', color: '#7d8b9f', marginTop: 4 };

export default function PostEditForm({ post }: { post: any }) {
  const [status, setStatus] = useState(post.status);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [price, setPrice] = useState(post.price ? String(post.price) : '');
  const [content, setContent] = useState(post.content || '');
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
      setSlug(generated);
    }
  }, [slug]);

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
    } catch (err) {
      alert('エラーが発生しました: ' + (err as Error).message);
      setSaving(false);
    }
  }, [title, slug, content, status, price, post.id, router]);

  const statusOptions = [
    { value: 'DRAFT', label: 'DRAFT — 下書き（非公開）', color: '#7d8b9f' },
    { value: 'PUBLISHED', label: 'PUBLISHED — 一般公開', color: '#6fd0a0' },
    { value: 'MEMBERS_ONLY', label: 'MEMBERS_ONLY — 無料会員以上', color: '#6495ed' },
    { value: 'PAID', label: 'PAID — 有料販売', color: '#f2d992' },
  ];

  const currentStatus = statusOptions.find(s => s.value === status);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="section-title" style={{ margin: 0 }}>
          <Link href="/admin/posts" style={{ color: 'inherit', textDecoration: 'none', marginRight: '8px' }}>← 戻る</Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ marginLeft: '8px' }}>記事の編集</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={() => handleSave('DRAFT')} disabled={saving}>
            {saving ? '保存中...' : '下書き保存'}
          </button>
          <button type="button" className="btn btn-gold" onClick={() => handleSave()} disabled={saving}>
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            <span style={labelTextStyle}>タイトル <span style={{ color: '#ef4444' }}>*</span></span>
            <input
              type="text" style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
              placeholder="記事タイトルを入力..."
              value={title} onChange={handleTitleChange}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>スラッグ (URL)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#7d8b9f', whiteSpace: 'nowrap' }}>/posts/</span>
              <input
                type="text" style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                placeholder="my-article-title"
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
                <span style={{ fontSize: 13, color: '#7d8b9f' }}>¥</span>
                <input type="number" style={{ ...inputStyle, marginTop: 0, flex: 1 }} placeholder="例: 1980" value={price} onChange={e => setPrice(e.target.value)} min={0} step={100} />
              </div>
            </label>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#b6c1d2', fontWeight: 600, marginBottom: 8 }}>
          本文
        </div>
        <BlockEditor 
          value={content} 
          onChange={setContent} 
        />
      </div>
    </div>
  );
}
