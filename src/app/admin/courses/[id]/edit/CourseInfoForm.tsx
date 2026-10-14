'use client';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCourse } from '@/actions/courses';
import ImagePicker from '@/components/ImagePicker';
import { JourneyFields, TagFields } from '../../CourseExtraFields';

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
  thumbnailUrl: string | null;
  tagIds: string[];
  prerequisiteIds: string[];
  unlockCompletedCourses: number | null;
  unlockPoints: number | null;
  isHidden: boolean;
  akinaiProductIds: string[];
  purchaseUrl: string | null;
};

type Plan = { id: string; name: string };

type Props = {
  course: Course;
  plans?: Plan[];
  categories?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];
  otherCourses?: { id: string; number: string; title: string }[];
  akinaiProducts?: { id: string; name: string }[] | null;
};

export default function CourseInfoForm({ course, plans = [], categories = [], tags = [], otherCourses = [], akinaiProducts = null }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaved(false);
    startTransition(async () => {
      try {
        const result = await updateCourse(course.id, formData);
        if (!result.success) {
          alert(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch (err) {
        alert('エラーが発生しました: ' + (err as Error).message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 10 }}>サムネイル（任意）</span>
        <ImagePicker
          name="thumbnailUrl"
          purpose="thumbnail"
          shape="wide"
          initialUrl={course.thumbnailUrl}
          hint="横長（2:1 程度、例: 1600×800）の画像がおすすめです。未設定の場合はタイトルから自動でカバーを作ります。"
        />
      </div>
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
        <select name="categoryId" style={inputStyle} defaultValue={course.categoryId ?? ''}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value="">未分類</option>
        </select>
      </label>

      <TagFields tags={tags} selected={course.tagIds} />

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
          <option value="">登録済みの全会員に公開</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>{plan.name} 会員限定</option>
          ))}
        </select>
      </label>

      {akinaiProducts && (
        <fieldset style={{ ...labelStyle, border: '1px solid var(--line)', borderRadius: 8, padding: '12px 14px' }}>
          <legend style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600, padding: '0 6px' }}>Akinai hubで販売（購入者に開放）</legend>
          <input type="hidden" name="akinaiFields" value="1" />
          {akinaiProducts.length === 0 && course.akinaiProductIds.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>商品を取得できませんでした。Akinai hubの連携アプリ設定と接続情報を確認してください。</p>
          )}
          {[...akinaiProducts, ...course.akinaiProductIds.filter((id) => !akinaiProducts.some((p) => p.id === id)).map((id) => ({ id, name: `（取得できない商品 ${id.slice(0, 8)}…）` }))].map((p) => (
            <label key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 6 }}>
              <input type="checkbox" name="akinaiProductIds" value={p.id} defaultChecked={course.akinaiProductIds.includes(p.id)} />
              {p.name}
            </label>
          ))}
          <label style={{ display: 'block', marginTop: 12 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>購入ページのURL（ロック画面のボタン先）</span>
            <input type="url" name="purchaseUrl" style={inputStyle} defaultValue={course.purchaseUrl ?? ''} placeholder="https://store.example.com/shop/store/course" />
          </label>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>選んだ商品のどれかを購入した会員（ログイン中のメールアドレスで判定）にこの講座が開放されます。未選択なら販売しません。</p>
        </fieldset>
      )}

      <JourneyFields courses={otherCourses} value={course} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" disabled={isPending} className="btn btn-gold">
          {isPending ? '保存中...' : '変更を保存'}
        </button>
        {saved && !isPending && <span style={{ color: '#8ce0a8', fontSize: '13px' }}>保存しました</span>}
      </div>
    </form>
  );
}
