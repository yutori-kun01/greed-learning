import { getUsers } from '@/actions/users'
import AdminUsersClientUI from './AdminUsersClientUI'

export default async function AdminUsersPage() {
  const users = await getUsers()
  return <AdminUsersClientUI users={users} />
}
