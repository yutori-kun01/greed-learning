import { getDb } from '@/db';
import { resources } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import ResourcesClient from './ResourcesClient';

export default async function ResourcesAdminPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const db = getDb(process.env.DB as unknown as D1Database);
  const allResources = await db.select().from(resources).orderBy(resources.sortOrder);

  async function addResource(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const fileUrl = formData.get('fileUrl') as string;
    
    if (!title) return;

    const db = getDb(process.env.DB as unknown as D1Database);
    await db.insert(resources).values({
      id: crypto.randomUUID(),
      title,
      description,
      imageUrl,
      fileUrl,
      sortOrder: allResources.length,
    });
    revalidatePath('/admin/resources');
    revalidatePath('/resources');
  }

  async function deleteResource(id: string) {
    'use server';
    const db = getDb(process.env.DB as unknown as D1Database);
    await db.delete(resources).where(eq(resources.id, id));
    revalidatePath('/admin/resources');
    revalidatePath('/resources');
  }

  return (
    <div>
      <h1 className="section-title">リソース特典管理</h1>
      <p style={{ color: '#7d8b9f', marginBottom: '24px' }}>
        ユーザーがダウンロードできる特典ファイルやリンクを管理します。
      </p>
      
      <ResourcesClient 
        resources={allResources} 
        onAdd={addResource} 
        onDelete={deleteResource} 
      />
    </div>
  );
}
