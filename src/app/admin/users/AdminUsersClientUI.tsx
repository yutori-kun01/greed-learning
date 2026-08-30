'use client'
import React, { useState, useTransition } from 'react'
import { setUserStatus, getUserCompletedLessonCount } from '@/actions/users'

type AdminUser = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: string | number | Date
  lastActivityDate: string | null
  planName: string | null
  subscriptionStatus: string
  noteId: string | null
}

const inputStyle = { display: 'block', width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }

const badges = {
  ADMIN: { background: 'rgba(217,180,91,.15)', color: 'var(--gold-2)', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  MEMBER: { background: 'var(--line-2)', color: 'var(--text-2)', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
}

const statusBadges = {
  ACTIVE: { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  SUSPENDED: { background: 'rgba(239,68,68,.15)', color: '#ef4444', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
}

function formatDate(d: string | number | Date | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ja-JP')
}

export default function AdminUsersClientUI({ users: initialUsers }: { users: AdminUser[] }) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(initialUsers)
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null)
  const [completedCount, setCompletedCount] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredUsers = users.filter(u =>
    u.name.includes(search) || u.email.includes(search)
  )

  const openDetail = (u: AdminUser) => {
    setDetailUser(u)
    setCompletedCount(null)
    getUserCompletedLessonCount(u.id).then(setCompletedCount).catch(() => setCompletedCount(0))
  }

  const toggleSuspend = (u: AdminUser) => {
    const nextStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    if (!confirm(u.status === 'ACTIVE' ? `${u.name} さんを停止しますか？` : `${u.name} さんの停止を解除しますか？`)) return

    startTransition(async () => {
      try {
        await setUserStatus(u.id, nextStatus)
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: nextStatus } : x))
        setDetailUser(prev => prev && prev.id === u.id ? { ...prev, status: nextStatus } : prev)
      } catch (err) {
        alert('エラーが発生しました: ' + (err as Error).message)
      }
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>ユーザー管理</h1>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="名前またはメールアドレスで検索..."
          style={inputStyle}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>名前</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>メール</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>ロール</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>プラン</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>ステータス</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>登録日</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{u.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{u.email}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <span style={badges[u.role]}>{u.role}</span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{u.planName || '-'}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <span style={statusBadges[u.status]}>{u.status === 'ACTIVE' ? 'ACTIVE' : '停止中'}</span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{formatDate(u.createdAt)}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => openDetail(u)}>詳細</button>
                    {u.role !== 'ADMIN' && (
                      <button
                        style={{ color: u.status === 'ACTIVE' ? '#ef4444' : '#6fd0a0', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => toggleSuspend(u)}
                        disabled={isPending}
                      >
                        {u.status === 'ACTIVE' ? '停止' : '解除'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            見つかりませんでした。
          </div>
        )}
      </div>

      {detailUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setDetailUser(null)}
        >
          <div
            className="panel"
            style={{ width: 420, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="panel-title" style={{ margin: 0 }}>ユーザー詳細</h2>
              <button
                onClick={() => setDetailUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div><span style={{ color: 'var(--muted)' }}>名前：</span><span style={{ color: 'var(--text)' }}>{detailUser.name}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>メール：</span><span style={{ color: 'var(--text)' }}>{detailUser.email}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>ロール：</span><span style={badges[detailUser.role]}>{detailUser.role}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>ステータス：</span><span style={statusBadges[detailUser.status]}>{detailUser.status === 'ACTIVE' ? 'ACTIVE' : '停止中'}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>プラン：</span><span style={{ color: 'var(--text)' }}>{detailUser.planName || '未契約'} {detailUser.planName && `(${detailUser.subscriptionStatus})`}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>note ID：</span><span style={{ color: 'var(--text)' }}>{detailUser.noteId || '未設定'}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>登録日：</span><span style={{ color: 'var(--text)' }}>{formatDate(detailUser.createdAt)}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>最終学習日：</span><span style={{ color: 'var(--text)' }}>{formatDate(detailUser.lastActivityDate)}</span></div>
              <div><span style={{ color: 'var(--muted)' }}>完了レッスン数：</span><span style={{ color: 'var(--text)' }}>{completedCount === null ? '読込中...' : completedCount}</span></div>
            </div>
            {detailUser.role !== 'ADMIN' && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <button
                  style={{ color: detailUser.status === 'ACTIVE' ? '#ef4444' : '#6fd0a0', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 600 }}
                  onClick={() => toggleSuspend(detailUser)}
                  disabled={isPending}
                >
                  {detailUser.status === 'ACTIVE' ? 'このユーザーを停止する' : '停止を解除する'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
