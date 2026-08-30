import React from 'react';
import Link from 'next/link';
import { getDb } from '@/db';
import { user, courses, purchases, plans } from '@/db/schema';
import { desc, count, sum, gte } from 'drizzle-orm';
import { getSiteSettingsQuery } from '@/actions/settings';
import Stripe from 'stripe';
import CommandLine from '@/components/CommandLine';

async function checkStripeConnection() {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' as any });
    await stripe.balance.retrieve();
    return true;
  } catch {
    return false;
  }
}

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

  // Setup checklist
  const settings = await getSiteSettingsQuery();
  const plansResult = await db.select({ value: count() }).from(plans);
  const totalPlans = plansResult[0].value;
  const stripeConnected = await checkStripeConnection();

  const emailConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://<your-domain>';

  const checklist: {
    label: string;
    done: boolean;
    href?: string;
    commands?: { command: string; note?: string }[];
  }[] = [
    { label: 'サイト名・ブランドを設定する', done: !!settings, href: '/admin/settings' },
    { label: '特定商取引法に基づく表記（事業者情報）を入力する', done: !!(settings?.operatorName && settings?.operatorEmail), href: '/admin/settings' },
    {
      label: 'Stripeを接続する',
      done: stripeConnected,
      href: 'https://dashboard.stripe.com/apikeys',
      commands: [
        { command: 'npx wrangler secret put STRIPE_SECRET_KEY', note: 'Stripeダッシュボード → 開発者 → APIキー の「シークレットキー」を貼り付けてください（本番運用時は制限付きキーの利用も検討してください）' },
        { command: 'npx wrangler secret put STRIPE_WEBHOOK_SECRET', note: `Stripeダッシュボード → 開発者 → Webhook でエンドポイントを追加した際に発行される署名シークレットを貼り付けてください。エンドポイントURL: ${appUrl}/api/webhooks/stripe` },
      ],
    },
    {
      label: 'メール送信（パスワード再設定等）を設定する',
      done: emailConfigured,
      href: 'https://resend.com/api-keys',
      commands: [
        { command: 'npx wrangler secret put RESEND_API_KEY', note: 'https://resend.com/api-keys で発行したAPIキーを貼り付けてください' },
        { command: 'npx wrangler secret put RESEND_FROM_EMAIL', note: '例: no-reply@your-domain.com （Resend側で送信ドメインの認証が必要です）' },
      ],
    },
    { label: '会員プランを作成する', done: totalPlans > 0, href: '/admin/plans' },
    { label: '講座を作成する', done: totalCourses > 0, href: '/admin/courses' },
  ];
  const remaining = checklist.filter(c => !c.done);

  const badgeStyle = { background: 'rgba(111,208,160,.15)', color: '#6fd0a0', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }

  return (
    <div>
      <h1 className="section-title">管理者ダッシュボード</h1>

      {remaining.length > 0 && (
        <div className="panel" style={{ marginBottom: '24px', border: '1px solid rgba(217,180,91,.3)' }}>
          <h2 className="panel-title">セットアップガイド（残り{remaining.length}項目）</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checklist.map(item => {
              const checkIcon = (
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                  background: item.done ? 'rgba(111,208,160,.2)' : 'var(--line-2)',
                  color: item.done ? '#6fd0a0' : 'var(--muted)',
                }}>
                  {item.done ? '✓' : ''}
                </span>
              );

              if (!item.done && item.commands) {
                return (
                  <details key={item.label}>
                    <summary style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text)', fontSize: 14, listStyle: 'none' }}>
                      {checkIcon}
                      <span>{item.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--gold-2)', marginLeft: 4 }}>（コマンドを表示）</span>
                    </summary>
                    <div style={{ marginTop: 10, marginLeft: 28, paddingLeft: 12, borderLeft: '2px solid var(--line)' }}>
                      {item.href && (
                        <Link href={item.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--gold-2)', display: 'block', marginBottom: 10 }}>
                          → まず{item.label.includes('Stripe') ? 'Stripeダッシュボード' : 'Resend'}でキーを発行する
                        </Link>
                      )}
                      {item.commands.map(c => (
                        <CommandLine key={c.command} command={c.command} note={c.note} />
                      ))}
                    </div>
                  </details>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href || '#'}
                  target={item.href?.startsWith('http') ? '_blank' : undefined}
                  rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: item.done ? 'var(--muted)' : 'var(--text)', fontSize: 14 }}
                >
                  {checkIcon}
                  <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
