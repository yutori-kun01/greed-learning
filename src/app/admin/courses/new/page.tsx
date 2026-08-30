import { getPlans } from '@/actions/plans'
import NewCourseForm from './NewCourseForm'

export default async function AdminNewCoursePage() {
  const plans = await getPlans()
  return <NewCourseForm plans={plans} />
}
