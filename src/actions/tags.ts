'use server';

import { getDb } from '@/db';
import { tags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/session';

const db = () => getDb(process.env.DB as unknown as D1Database);

export type TagResult = { success: true } | { success: false; error: string };

const MAX_NAME = 20;

/** Tags are shown as "#name", so a leading # typed by the admin is dropped. */
function validName(raw: string): string | { error: string } {
  const name = (raw ?? '').trim().replace(/^#+/, '').trim();
  if (!name) return { error: 'タグ名を入力してください' };
  if (name.length > MAX_NAME) return { error: `タグ名は${MAX_NAME}文字以内にしてください` };
  return name;
}

function refresh() {
  revalidatePath('/admin/tags');
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
}

export async function createTag(rawName: string): Promise<TagResult> {
  await requireAdmin();
  const name = validName(rawName);
  if (typeof name !== 'string') return { success: false, error: name.error };

  const clash = await db().select({ id: tags.id }).from(tags).where(eq(tags.name, name)).limit(1);
  if (clash[0]) return { success: false, error: '同じ名前のタグがすでにあります' };

  await db().insert(tags).values({ id: crypto.randomUUID(), name, createdAt: new Date().toISOString() });
  refresh();
  return { success: true };
}

export async function renameTag(id: string, rawName: string): Promise<TagResult> {
  await requireAdmin();
  const name = validName(rawName);
  if (typeof name !== 'string') return { success: false, error: name.error };

  const clash = await db().select({ id: tags.id }).from(tags).where(eq(tags.name, name)).limit(1);
  if (clash[0] && clash[0].id !== id) return { success: false, error: '同じ名前のタグがすでにあります' };

  await db().update(tags).set({ name }).where(eq(tags.id, id));
  refresh();
  return { success: true };
}

/** Removes the tag from every course (courseTags cascades), not the courses. */
export async function deleteTag(id: string): Promise<TagResult> {
  await requireAdmin();
  await db().delete(tags).where(eq(tags.id, id));
  refresh();
  return { success: true };
}
