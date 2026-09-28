'use client'
import Link from 'next/link'
import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPlan } from '@/actions/plans'

export default function AdminNewPlanPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [billing, setBilling] = useState<'manual' | 'stripe'>('manual')

  const inputStyle = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', marginBottom: '16px' }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const result = await createPlan(formData)
        if (result.success) router.push('/admin/plans')
        else alert(result.error)
      } catch {
        alert('プランを作成できませんでした。Stripeの設定を確認してください。')
      }
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="section-title">プランの新規作成</h1>

      <div className="panel">
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
          講座の「公開範囲」にプランを指定すると、そのプランの会員だけが講座を見られるようになります。
        </p>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>プラン名</span>
            <input type="text" name="name" required style={inputStyle} placeholder="例: スタンダード会員" />
          </label>

          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>説明 (任意)</span>
            <textarea name="description" rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="プランの説明" />
          </label>

          <fieldset style={{ ...labelStyle, border: 'none', padding: 0, margin: '0 0 16px' }}>
            <legend style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600, marginBottom: 8 }}>付与の方法</legend>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginBottom: 8, cursor: 'pointer' }}>
              <input type="radio" name="billing" value="manual" checked={billing === 'manual'} onChange={() => setBilling('manual')} />
              <span><b>手動付与（無料）</b><br /><span style={{ color: 'var(--muted)' }}>「ユーザー管理」で会員ごとにオン／オフします。決済は不要です。</span></span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name="billing" value="stripe" checked={billing === 'stripe'} onChange={() => setBilling('stripe')} />
              <span><b>Stripeで販売（月額・年額）</b><br /><span style={{ color: 'var(--muted)' }}>会員が自分で購入します。Stripeの設定が必要で、作成後に価格は変更できません。</span></span>
            </label>
          </fieldset>

          {billing === 'stripe' && (
            <>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>価格 (円)</span>
            <input type="number" name="price" required min={1} step={1} style={inputStyle} placeholder="例: 4980" />
          </label>

          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>課金周期</span>
            <select name="interval" style={inputStyle}>
              <option value="month">毎月</option>
              <option value="year">毎年</option>
            </select>
          </label>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Link href="/admin/plans" className="btn btn-ghost">キャンセル</Link>
            <button type="submit" disabled={isPending} className="btn btn-gold">
              {isPending ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
