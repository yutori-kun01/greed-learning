import React from 'react';
import MemberSettingsForm from './MemberSettingsForm';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

export default async function MemberSettingsPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  return <MemberSettingsForm user={session?.user} />;
}

