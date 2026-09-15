import { getAllPlans } from '@/lib/plans'
import NewCourseForm from './NewCourseForm'

export default async function AdminNewCoursePage() {
  const plans = await getAllPlans()
  return <NewCourseForm plans={plans} />
}
