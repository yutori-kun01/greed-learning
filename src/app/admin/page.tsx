import React from 'react'

export default function AdminDashboard() {
  const badgeStyle = { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
  
  return (
    <div>
      <h1 className="section-title">管理ダッシュボード</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#7d8b9f', marginBottom: '8px' }}>総会員数</div>
          <div style={{ fontSize: '32px', color: '#d9b45b', fontWeight: 'bold' }}>142</div>
        </div>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#7d8b9f', marginBottom: '8px' }}>今月の新規登録</div>
          <div style={{ fontSize: '32px', color: '#d9b45b', fontWeight: 'bold' }}>18</div>
        </div>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#7d8b9f', marginBottom: '8px' }}>総講座数</div>
          <div style={{ fontSize: '32px', color: '#d9b45b', fontWeight: 'bold' }}>12</div>
        </div>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#7d8b9f', marginBottom: '8px' }}>月間収益</div>
          <div style={{ fontSize: '32px', color: '#d9b45b', fontWeight: 'bold' }}>¥284,000</div>
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: '18px' }}>最近の登録者</h2>
      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>名前</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>メール</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>登録日</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#7d8b9f', fontWeight: 600 }}>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: '山田 太郎', email: 'yamada@example.com', date: '2023-10-25', status: 'ACTIVE' },
              { name: '佐藤 花子', email: 'sato@example.com', date: '2023-10-24', status: 'ACTIVE' },
              { name: '鈴木 一郎', email: 'suzuki@example.com', date: '2023-10-22', status: 'ACTIVE' },
              { name: '田中 美咲', email: 'tanaka@example.com', date: '2023-10-20', status: 'ACTIVE' },
              { name: '伊藤 健太', email: 'ito@example.com', date: '2023-10-18', status: 'ACTIVE' }
            ].map((user, i) => (
              <tr key={i}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{user.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{user.email}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>{user.date}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={badgeStyle}>{user.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
