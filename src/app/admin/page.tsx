import React from 'react';
import { getDb } from '@/db';
import { user, courses, purchases } from '@/db/schema';
import { desc, count, sum, gte } from 'drizzle-orm';

export default async function AdminDashboard() {
  const db = getDb(process.env.DB as unknown as D1Database);

  // Real stats
  const usersResult = await db.select({ value: count() }).from(user);
  const totalUsers = usersResult[0].value;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newUsersResult = await db.select({ value: count() }).from(user).where(gte(user.createdAt, startOfMonth));
  const newUsersThisMonth = newUsersResult[0].value;

  const coursesResult = await db.select({ value: count() }).from(courses);
  const totalCourses = coursesResult[0].value;

  const purchasesResult = await db.select({ value: sum(purchases.amount) }).from(purchases);
  const totalRevenue = purchasesResult[0].value || 0;

  const recentUsers = await db.select().from(user).orderBy(desc(user.createdAt)).limit(5);

  const badgeStyle = { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }
  
  return (
    <div>
      <h1 className="section-title">管理者ダッシュボード</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>総会員数</div>
          <div style={{ fontSize: '32px', color: 'var(--gold)', fontWeight: 'bold' }}>{totalUsers}</div>
        </div>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>今月の新規登録</div>
          <div style={{ fontSize: '32px', color: 'var(--gold)', fontWeight: 'bold' }}>{newUsersThisMonth}</div>
        </div>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>総講座数</div>
          <div style={{ fontSize: '32px', color: 'var(--gold)', fontWeight: 'bold' }}>{totalCourses}</div>
        </div>
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>総収益</div>
          <div style={{ fontSize: '32px', color: 'var(--gold)', fontWeight: 'bold' }}>¥{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: '18px' }}>最近の登録者</h2>
      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>名前</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>メール</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>登録日</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u: any, i: number) => (
              <tr key={i}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{u.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{u.email}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <span style={badgeStyle}>ACTIVE</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
