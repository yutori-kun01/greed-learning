'use client';
import React, { useState } from 'react';

const badges = {
  ADMIN: { background: 'rgba(217,180,91,.15)', color: '#f2d992', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  MEMBER: { background: 'rgba(255,255,255,.08)', color: '#b6c1d2', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
};

const inputStyle = { display: 'block', width: '100%', background: '#101d31', border: '1px solid rgba(255,255,255,.07)', borderRadius: '6px', padding: '10px 14px', color: '#e9eef7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };

export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [search, setSearch] = useState('');

  const filteredUsers = initialUsers.filter(u => 
    (u.name && u.name.includes(search)) || (u.email && u.email.includes(search))
  );

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
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px', fontWeight: 600, color: '#e9eef7' }}>{u.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{u.email}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={badges[u.role as keyof typeof badges] || badges.MEMBER}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  {u.lastActivityDate ? new Date(u.lastActivityDate).toLocaleDateString() : '-'}
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
  );
}
