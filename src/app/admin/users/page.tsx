'use client'
import React, { useState } from 'react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  
  const badges = {
    ADMIN: { background: 'rgba(217,180,91,.15)', color: '#f2d992', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
    MEMBER: { background: 'rgba(255,255,255,.08)', color: '#b6c1d2', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
  }

  const allUsers = [
    { name: '管理 太郎', email: 'admin1@example.com', role: 'ADMIN', registered: '2023-01-10', lastLogin: '2023-11-05' },
    { name: 'システム 花子', email: 'admin2@example.com', role: 'ADMIN', registered: '2023-01-15', lastLogin: '2023-11-04' },
    { name: '山田 太郎', email: 'yamada@example.com', role: 'MEMBER', registered: '2023-10-25', lastLogin: '2023-11-01' },
    { name: '佐藤 花子', email: 'sato@example.com', role: 'MEMBER', registered: '2023-10-24', lastLogin: '2023-10-30' },
    { name: '鈴木 一郎', email: 'suzuki@example.com', role: 'MEMBER', registered: '2023-10-22', lastLogin: '2023-11-02' },
    { name: '田中 美咲', email: 'tanaka@example.com', role: 'MEMBER', registered: '2023-10-20', lastLogin: '2023-10-21' },
    { name: '伊藤 健太', email: 'ito@example.com', role: 'MEMBER', registered: '2023-10-18', lastLogin: '2023-11-05' },
    { name: '渡辺 結衣', email: 'watanabe@example.com', role: 'MEMBER', registered: '2023-10-15', lastLogin: '2023-10-16' },
  ]

  const filteredUsers = allUsers.filter(u => 
    u.name.includes(search) || u.email.includes(search)
  )

  const inputStyle = { display: 'block', width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px', padding: '10px 14px', color: '#e9eef7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }

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
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>登録日</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>最終ログイン</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, i) => (
              <tr key={i}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px', fontWeight: 600, color: '#e9eef7' }}>{user.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{user.email}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={badges[user.role as keyof typeof badges]}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{user.registered}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{user.lastLogin}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>詳細</button>
                    {user.role !== 'ADMIN' && (
                      <button style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', fontSize: '12px' }}>停止</button>
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
    </div>
  )
}
