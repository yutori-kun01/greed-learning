import React from 'react';
import { headers } from 'next/headers';
import AdminSettingsForm from './AdminSettingsForm';
import { getSiteSettingsQuery } from '@/lib/queries';
import { getEmailConfig } from '@/lib/email';

export default async function AdminSettingsPage() {
  const settings = await getSiteSettingsQuery();
  // The encrypted key never goes to the browser; the form only needs to know
  // whether email works and which key is in use.
  const initialSettings = settings ? { ...settings, resendApiKeyEnc: null } : null;
  const emailConfig = await getEmailConfig();
  const emailStatus = emailConfig
    ? { configured: true, source: emailConfig.source, keyHint: emailConfig.apiKey.slice(-4), from: emailConfig.from }
    : { configured: false as const };

  // The configured public URL when there is one; otherwise the address this
  // admin is using right now.
  const reqHeaders = await headers();
  const host = reqHeaders.get('host');
  const proto = host?.startsWith('localhost') ? 'http' : 'https';
  const origin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');

  return <AdminSettingsForm initialSettings={initialSettings} inviteUrl={`${origin}/signup`} emailStatus={emailStatus} />;
}
