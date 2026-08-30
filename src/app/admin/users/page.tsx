'use client'
import React, { useState } from 'react'

type MockUser = {
  name: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  registered: string
  lastLogin: string
  status: 'ACTIVE' | 'SUSPENDED'
  coursesCompleted: number
  noteId: string
}

const INITIAL_USERS: MockUser[] = [
  { name: '管理 太郎', email: 'admin1@example.com', role: 'ADMIN', registered: '2023-01-10', lastLogin: '2023-11-05', status: 'ACTIVE', coursesCompleted: 12, noteId: 'kanri_taro' },
  { name: 'システム 花子', email: 'admin2@example.com', role: 'ADMIN', registered: '2023-01-15', lastLogin: '2023-11-04', status: 'ACTIVE', coursesCompleted: 9, noteId: '' },
  { name: '山田 太郎', email: 'yamada@example.com', role: 'MEMBER', registered: '2023-10-25', lastLogin: '2023-11-01', status: 'ACTIVE', coursesCompleted: 3, noteId: 'yamada_t' },
  { name: '佐藤 花子', email: 'sato@example.com', role: 'MEMBER', registered: '2023-10-24', lastLogin: '2023-10-30', status: 'ACTIVE', coursesCompleted: 1, noteId: '' },
  { name: '鈴木 一郎', email: 'suzuki@example.com', role: 'MEMBER', registered: '2023-10-22', lastLogin: '2023-11-02', status: 'ACTIVE', coursesCompleted: 5, noteId: 'suzuki1' },
  { name: '田中 美咲', email: 'tanaka@example.com', role: 'MEMBER', registered: '2023-10-20', lastLogin: '2023-10-21', status: 'ACTIVE', coursesCompleted: 0, noteId: '' },
  { name: '伊藤 健太', email: 'ito@example.com', role: 'MEMBER', registered: '2023-10-18', lastLogin: '2023-11-05', status: 'ACTIVE', coursesCompleted: 7, noteId: 'ito_kenta' },
  { name: '渡辺 結衣', email: 'watanabe@example.com', role: 'MEMBER', registered: '2023-10-15', lastLogin: '2023-10-16', status: 'ACTIVE', coursesCompleted: 2, noteId: '' },
]

const inputStyle = { display: 'block', width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px', padding: '10px 14px', color: '#e9eef7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }

const badges = {
  ADMIN: { background: 'rgba(217,180,91,.15)', color: '#f2d992', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  MEMBER: { background: 'rgba(255,255,255,.08)', color: '#b6c1d2', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
}

const statusBadges = {
  ACTIVE: { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  SUSPENDED: { background: 'rgba(239,68,68,.15)', color: '#ef4444', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(INITIAL_USERS)
  const [detailUser, setDetailUser] = useState<MockUser | null>(null)

  const filteredUsers = users.filter(u =>
    u.name.includes(search) || u.email.includes(search)
  )

  const toggleSuspend = (email: string) => {
    setUsers(prev => prev.map(u =>
      u.email === email ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : u
    ))
    setDetailUser(prev => prev && prev.email === email
      ? { ...prev, status: prev.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
      : prev)
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
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>名前</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>メール</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>ロール</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>ステータス</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>登録日</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>最終ログイン</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.email}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px', fontWeight: 600, color: '#e9eef7' }}>{u.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{u.email}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={badges[u.role]}>{u.role}</span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={statusBadges[u.status]}>{u.status === 'ACTIVE' ? 'ACTIVE' : '停止中'}</span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{u.registered}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{u.lastLogin}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => setDetailUser(u)}>詳細</button>
                    {u.role !== 'ADMIN' && (
                      <button
                        style={{ color: u.status === 'ACTIVE' ? '#ef4444' : '#6fd0a0', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => {
                          if (confirm(u.status === 'ACTIVE' ? `${u.name} さんを停止しますか？` : `${u.name} さんの停止を解除しますか？`)) {
                            toggleSuspend(u.email)
                          }
                        }}
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
          <div style={{ padding: '24px', textAlign: 'center', color: '#7d8b9f', fontSize: '13px' }}>
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
                style={{ background: 'transparent', border: 'none', color: '#7d8b9f', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div><span style={{ color: '#7d8b9f' }}>名前：</span><span style={{ color: '#e9eef7' }}>{detailUser.name}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>メール：</span><span style={{ color: '#e9eef7' }}>{detailUser.email}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>ロール：</span><span style={badges[detailUser.role]}>{detailUser.role}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>ステータス：</span><span style={statusBadges[detailUser.status]}>{detailUser.status === 'ACTIVE' ? 'ACTIVE' : '停止中'}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>note ID：</span><span style={{ color: '#e9eef7' }}>{detailUser.noteId || '未設定'}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>登録日：</span><span style={{ color: '#e9eef7' }}>{detailUser.registered}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>最終ログイン：</span><span style={{ color: '#e9eef7' }}>{detailUser.lastLogin}</span></div>
              <div><span style={{ color: '#7d8b9f' }}>完了講座数：</span><span style={{ color: '#e9eef7' }}>{detailUser.coursesCompleted}</span></div>
            </div>
            {detailUser.role !== 'ADMIN' && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                <button
                  style={{ color: detailUser.status === 'ACTIVE' ? '#ef4444' : '#6fd0a0', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 600 }}
                  onClick={() => {
                    if (confirm(detailUser.status === 'ACTIVE' ? `${detailUser.name} さんを停止しますか？` : `${detailUser.name} さんの停止を解除しますか？`)) {
                      toggleSuspend(detailUser.email)
                    }
                  }}
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
