'use server';

import { getDb } from '@/db';
import { categories, courses } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';

const db = () => getDb(process.env.DB as unknown as D1Database);

export type CategoryResult = { success: true } | { success: false; error: string };

const MAX_NAME = 30;

function validName(raw: string): string | { error: string } {
  const name = (raw ?? '').trim();
  if (!name) return { error: 'カテゴリ名を入力してください' };
  if (name.length > MAX_NAME) return { error: `カテゴリ名は${MAX_NAME}文字以内にしてください` };
  return name;
}

function refresh() {
  revalidatePath('/admin/categories');
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
}

export async function createCategory(rawName: string): Promise<CategoryResult> {
  await requireAdmin();
  const name = validName(rawName);
  if (typeof name !== 'string') return { success: false, error: name.error };

  const all = await db().select({ name: categories.name, sortOrder: categories.sortOrder }).from(categories);
  if (all.some((c: { name: string }) => c.name === name)) {
    return { success: false, error: '同じ名前のカテゴリがすでにあります' };
  }
  const nextOrder = all.reduce((max: number, c: { sortOrder: number }) => Math.max(max, c.sortOrder), 0) + 1;

  await db().insert(categories).values({
    id: crypto.randomUUID(),
    name,
    sortOrder: nextOrder,
    createdAt: new Date().toISOString(),
  });
  refresh();
  return { success: true };
}

export async function renameCategory(id: string, rawName: string): Promise<CategoryResult> {
  await requireAdmin();
  const name = validName(rawName);
  if (typeof name !== 'string') return { success: false, error: name.error };

  const clash = await db().select({ id: categories.id }).from(categories).where(eq(categories.name, name)).limit(1);
  if (clash[0] && clash[0].id !== id) {
    return { success: false, error: '同じ名前のカテゴリがすでにあります' };
  }
  await db().update(categories).set({ name }).where(eq(categories.id, id));
  refresh();
  return { success: true };
}

/** Swaps a category with its neighbour in the display order. */
export async function moveCategory(id: string, direction: 'up' | 'down'): Promise<CategoryResult> {
  await requireAdmin();
  const all = await db()
    .select({ id: categories.id })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));
  const index = all.findIndex((c: { id: string }) => c.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= all.length) return { success: true };

  const order = all.map((c: { id: string }) => c.id);
  [order[index], order[target]] = [order[target], order[index]];
  // Renumber everything so orders stay dense even after deletions.
  for (let i = 0; i < order.length; i++) {
    await db().update(categories).set({ sortOrder: i + 1 }).where(eq(categories.id, order[i]));
  }
  refresh();
  return { success: true };
}

/** Deletes a category; its courses become 未分類 rather than disappearing. */
export async function deleteCategory(id: string): Promise<CategoryResult> {
  await requireAdmin();
  await db().update(courses).set({ categoryId: null }).where(eq(courses.categoryId, id));
  await db().delete(categories).where(eq(categories.id, id));
  refresh();
  return { success: true };
}
