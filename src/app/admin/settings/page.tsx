import React from 'react';
import { headers } from 'next/headers';
import AdminSettingsForm from './AdminSettingsForm';
import { getSiteSettingsQuery } from '@/lib/queries';

export default async function AdminSettingsPage() {
  const initialSettings = await getSiteSettingsQuery();

  // The configured public URL when there is one; otherwise the address this
  // admin is using right now.
  const reqHeaders = await headers();
  const host = reqHeaders.get('host');
  const proto = host?.startsWith('localhost') ? 'http' : 'https';
  const origin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');

  return <AdminSettingsForm initialSettings={initialSettings} inviteUrl={`${origin}/signup`} />;
}
