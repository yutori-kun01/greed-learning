import React from 'react';
import AdminSettingsForm from './AdminSettingsForm';
import { getSiteSettings } from '@/lib/siteSettings';

export default async function AdminSettingsPage() {
  const initialSettings = await getSiteSettings();
  
  return <AdminSettingsForm initialSettings={initialSettings} />;
}

