import { getCategories, getPlansForAdmin } from '@/lib/queries'
import NewCourseForm from './NewCourseForm'

export default async function AdminNewCoursePage() {
  const [plans, categories] = await Promise.all([getPlansForAdmin(), getCategories()])
  return <NewCourseForm plans={plans} categories={categories} />
}
