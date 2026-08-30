import { getDb } from '@/db';
import { courses } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAccessibleCourseIds } from '@/lib/access';
import { getResourcesForCourses } from '@/actions/resources';
import ResourcesClientUI from './ResourcesClientUI';

export default async function ResourcesPage() {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  const userId = session?.user?.id;

  const db = getDb(process.env.DB as unknown as D1Database);
  const allCourses = await db.select().from(courses);

  const accessibleIds = userId
    ? await getAccessibleCourseIds(process.env.DB as unknown as D1Database, userId, allCourses)
    : new Set<string>();

  const resources = await getResourcesForCourses([...accessibleIds]);

  return <ResourcesClientUI resources={resources} />;
}
