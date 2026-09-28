import React from 'react'
import { getAuth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'
import { getSiteSettingsQuery } from '@/lib/queries'

// Every page under here renders live, per-account data. None of it may be
// prerendered or shared between users, and a page that does not itself call
// a request-time API would otherwise be generated at build time against no
// database at all.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    redirect('/login');
  }
  
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const settings = await getSiteSettingsQuery();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}>
      <AdminSidebar siteName={settings?.siteName || 'N8N MARKETING'} />
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <div style={{ padding: '32px 36px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
