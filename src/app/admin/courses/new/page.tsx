import { getCategories, getCoursesForAdmin, getPlansForAdmin, getTags } from '@/lib/queries'
import NewCourseForm from './NewCourseForm'

export default async function AdminNewCoursePage() {
  const [plans, categories, tags, courses] = await Promise.all([
    getPlansForAdmin(),
    getCategories(),
    getTags(),
    getCoursesForAdmin(),
  ])
  return (
    <NewCourseForm
      plans={plans}
      categories={categories}
      tags={tags}
      courses={courses.map((c: { id: string; number: string; title: string }) => ({ id: c.id, number: c.number, title: c.title }))}
    />
  )
}
