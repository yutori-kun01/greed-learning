import React from 'react';
import { count } from 'drizzle-orm';
import { getDb } from '@/db';
import { courses } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { getCategories } from '@/lib/queries';
import CategoryManager from './CategoryManager';

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategories();

  const rows = await getDb(process.env.DB as unknown as D1Database)
    .select({ categoryId: courses.categoryId, n: count() })
    .from(courses)
    .groupBy(courses.categoryId);
  const counts: Record<string, number> = {};
  for (const r of rows as Array<{ categoryId: string | null; n: number }>) {
    counts[r.categoryId ?? ''] = r.n;
  }

  return (
    <CategoryManager
      categories={categories.map((c: { id: string; name: string }) => ({ ...c, courseCount: counts[c.id] ?? 0 }))}
    />
  );
}
