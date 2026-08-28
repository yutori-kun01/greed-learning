import React from 'react';
import AdminSettingsForm from './AdminSettingsForm';
import { getSiteSettingsQuery } from '@/actions/settings';

export default async function AdminSettingsPage() {
  const initialSettings = await getSiteSettingsQuery();
  
  return <AdminSettingsForm initialSettings={initialSettings} />;
}

