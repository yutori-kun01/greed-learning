import React from 'react';
import { requireAdmin } from '@/lib/session';
import { getRewardsForAdmin, getSiteSettingsQuery } from '@/lib/queries';
import { POINTS, resolvePointValues } from '@/lib/points';
import RewardManager from './RewardManager';

export default async function AdminRewardsPage() {
  await requireAdmin();
  const [rewards, settings] = await Promise.all([getRewardsForAdmin(), getSiteSettingsQuery()]);
  return <RewardManager rewards={rewards} points={resolvePointValues(settings)} defaults={POINTS} />;
}
