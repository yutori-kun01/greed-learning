import Link from 'next/link';
import React from 'react';
import { getPlans } from '@/actions/plans';
import PlanRowActions from './PlanRowActions';

export default async function AdminPlansPage() {
  const badgeActive = { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 };
  const badgeInactive = { background: 'rgba(255,255,255,.08)', color: 'var(--muted)', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 };

  const plans = await getPlans();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>プラン管理</h1>
        <Link href="/admin/plans/new" className="btn btn-gold">新規作成</Link>
      </div>

      <div className="panel" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>プラン名</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>価格</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>周期</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>ステータス</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>プランがありません</td>
              </tr>
            ) : plans.map((plan: any) => (
              <tr key={plan.id}>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{plan.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>¥{plan.price.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>{plan.interval === 'year' ? '年払い' : '月払い'}</td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <span style={plan.isActive ? badgeActive : badgeInactive}>{plan.isActive ? '有効' : '無効'}</span>
                </td>
                <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: '13px' }}>
                  <PlanRowActions id={plan.id} isActive={plan.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
