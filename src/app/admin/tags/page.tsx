import React from 'react';
import { count } from 'drizzle-orm';
import { getDb } from '@/db';
import { courseTags } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { getTags } from '@/lib/queries';
import TagManager from './TagManager';

export default async function AdminTagsPage() {
  await requireAdmin();
  const tags = await getTags();

  const rows = await getDb(process.env.DB as unknown as D1Database)
    .select({ tagId: courseTags.tagId, n: count() })
    .from(courseTags)
    .groupBy(courseTags.tagId);
  const counts = new Map((rows as Array<{ tagId: string; n: number }>).map((r) => [r.tagId, r.n]));

  return <TagManager tags={tags.map((t: { id: string; name: string }) => ({ ...t, courseCount: counts.get(t.id) ?? 0 }))} />;
}
