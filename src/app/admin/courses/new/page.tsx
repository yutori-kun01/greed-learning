'use client'
import Link from 'next/link'
import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/actions/courses'

export default function AdminNewCoursePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const inputStyle = { display: 'block', width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px', padding: '10px 14px', color: '#e9eef7', fontSize: '13px', outline: 'none', marginTop: '6px', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', marginBottom: '16px' }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await createCourse(formData)
        router.push('/admin/courses')
      } catch (err) {
        alert('エラーが発生しました: ' + (err as Error).message)
      }
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="section-title">講座の新規作成</h1>
      
      <div className="panel">
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>講座番号</span>
            <input type="text" name="number" required style={inputStyle} placeholder="例: 01" />
          </label>
          
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>タイトル</span>
            <input type="text" name="title" required style={inputStyle} placeholder="講座のタイトル" />
          </label>
          
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>説明</span>
            <textarea name="description" rows={4} required style={{ ...inputStyle, resize: 'vertical' }} placeholder="講座の詳細説明" />
          </label>
          
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>カテゴリ</span>
            <select name="categoryId" style={inputStyle}>
              <option value="strategy">strategy</option>
              <option value="traffic">traffic</option>
              <option value="content">content</option>
            </select>
          </label>
          
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>ステータス</span>
            <select name="status" style={inputStyle}>
              <option value="DRAFT">DRAFT (下書き)</option>
              <option value="PUBLISHED">PUBLISHED (公開)</option>
            </select>
          </label>
          
          <label style={labelStyle}>
            <span style={{ fontSize: '13px', color: '#b6c1d2', fontWeight: 600 }}>バッジ (任意)</span>
            <input type="text" name="badge" style={inputStyle} placeholder="例: NEW, 人気" />
          </label>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Link href="/admin/courses" className="btn btn-ghost">キャンセル</Link>
            <button type="submit" disabled={isPending} className="btn btn-gold">
              {isPending ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
