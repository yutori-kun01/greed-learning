import { getDb } from '@/db';
import { courses } from '@/db/schema';
import { requireUser } from '@/lib/session';
import { getAccessibleCourseIds } from '@/lib/access';
import { getResourcesForCourses } from '@/lib/queries';
import ResourcesClientUI, { type ResourceCard } from './ResourcesClientUI';

export default async function ResourcesPage() {
  const me = await requireUser();
  const d1 = process.env.DB as unknown as D1Database;
  const db = getDb(d1);

  const allCourses = await db
    .select({ id: courses.id, requiredPlanId: courses.requiredPlanId })
    .from(courses);

  const accessibleIds = await getAccessibleCourseIds(d1, me.id, allCourses);
  const resources = await getResourcesForCourses([...accessibleIds]);

  // Only what the card needs. The file location stays on the server — members
  // reach it through /api/resources/[id]/download, which re-checks access.
  const cards: ResourceCard[] = resources.map(
    (r: {
      id: string;
      icon: string;
      title: string;
      description: string | null;
      fileUrl: string | null;
      objectKey: string | null;
      fileName: string | null;
      fileSize: number | null;
    }) => ({
      id: r.id,
      icon: r.icon,
      title: r.title,
      description: r.description,
      hasDownload: Boolean(r.objectKey || r.fileUrl),
      fileName: r.fileName,
      fileSize: r.fileSize,
      isExternal: !r.objectKey && Boolean(r.fileUrl),
    })
  );

  return <ResourcesClientUI resources={cards} />;
}
