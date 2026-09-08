import { getDb } from '@/db';
import { courseCategories } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const db = getDb(process.env.DB as unknown as D1Database);
  const categories = await db.select().from(courseCategories).orderBy(courseCategories.sortOrder);

  async function addCategory(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    if (!name || !slug) return;

    const db = getDb(process.env.DB as unknown as D1Database);
    await db.insert(courseCategories).values({
      id: crypto.randomUUID(),
      name,
      slug,
      sortOrder: categories.length,
    });
    revalidatePath('/admin/categories');
  }

  async function deleteCategory(id: string) {
    'use server';
    const db = getDb(process.env.DB as unknown as D1Database);
    await db.delete(courseCategories).where(eq(courseCategories.id, id));
    revalidatePath('/admin/categories');
  }

  return (
    <div>
      <h1 className="section-title">講座カテゴリ管理</h1>
      <p style={{ color: '#7d8b9f', marginBottom: '24px' }}>
        講座に紐づけるカテゴリを作成・管理できます。
      </p>
      
      <CategoriesClient 
        categories={categories} 
        onAdd={addCategory} 
        onDelete={deleteCategory} 
      />
    </div>
  );
}
