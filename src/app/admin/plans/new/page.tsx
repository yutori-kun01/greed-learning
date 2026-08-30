'use client'
import Link from 'next/link'
import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPlan } from '@/actions/plans'

export default function AdminNewPlanPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const inputStyle = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', marginBottom: '16px' }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createPlan(formData)
        router.push('/admin/plans')
      } catch (err) {
        alert('エラーが発生しました: ' + (err as Error).message)
      }
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="section-title">プランの新規作成</h1>

      <div className="panel">
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          作成すると同時にStripe上にも商品・価格が自動作成されます。作成後の価格変更はできないため、金額を変える場合は新しいプランとして作成してください。
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

          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>価格 (円)</span>
            <input type="number" name="price" required min={1} step={100} style={inputStyle} placeholder="例: 4980" />
          </label>

          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 }}>課金周期</span>
            <select name="interval" style={inputStyle}>
              <option value="month">毎月</option>
              <option value="year">毎年</option>
            </select>
          </label>

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
