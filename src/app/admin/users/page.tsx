import React from 'react'
import { getDb } from '@/db'
import { user } from '@/db/schema'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const db = getDb(process.env.DB as unknown as D1Database);
  const usersList = await db.select().from(user);
  
  return <AdminUsersClient initialUsers={usersList} />
}
