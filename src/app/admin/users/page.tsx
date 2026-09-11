import { getUsers } from '@/lib/queries'
import AdminUsersClientUI from './AdminUsersClientUI'

export default async function AdminUsersPage() {
  const users = await getUsers()
  return <AdminUsersClientUI users={users} />
}
