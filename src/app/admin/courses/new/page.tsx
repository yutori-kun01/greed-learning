import { getPlansForAdmin } from '@/lib/queries'
import NewCourseForm from './NewCourseForm'

export default async function AdminNewCoursePage() {
  const plans = await getPlansForAdmin()
  return <NewCourseForm plans={plans} />
}
