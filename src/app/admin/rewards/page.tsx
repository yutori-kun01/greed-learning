import React from 'react';
import { requireAdmin } from '@/lib/session';
import { getRewardsForAdmin } from '@/lib/queries';
import { POINTS } from '@/lib/points';
import RewardManager from './RewardManager';

export default async function AdminRewardsPage() {
  await requireAdmin();
  const rewards = await getRewardsForAdmin();
  return <RewardManager rewards={rewards} points={POINTS} />;
}
