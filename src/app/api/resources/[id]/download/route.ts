import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { courseResources, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/session';
import { canAccessCourse } from '@/lib/access';
import { getR2Config, signDownload } from '@/lib/r2';

/**
 * The only way a member reaches a perk.
 *
 * Access is re-checked here rather than trusted from the page that rendered
 * the link, and the destination is never written into the HTML — an R2 file
 * is handed out as a signed URL valid for two minutes, and an external link
 * is only revealed to someone who has access right now.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb(process.env.DB as unknown as D1Database);

  const rows = await db
    .select({
      objectKey: courseResources.objectKey,
      fileUrl: courseResources.fileUrl,
      fileName: courseResources.fileName,
      courseId: courseResources.courseId,
      requiredPlanId: courses.requiredPlanId,
    })
    .from(courseResources)
    .innerJoin(courses, eq(courses.id, courseResources.courseId))
    .where(eq(courseResources.id, id))
    .limit(1);

  const resource = rows[0];
  if (!resource) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const hasAccess = await canAccessCourse(process.env.DB as unknown as D1Database, userId, {
    id: resource.courseId,
    requiredPlanId: resource.requiredPlanId,
  });
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (resource.objectKey) {
    const config = getR2Config();
    if (!config) {
      return NextResponse.json({ error: 'R2 is not configured' }, { status: 500 });
    }
    const url = await signDownload(config, resource.objectKey, resource.fileName);
    return NextResponse.redirect(url, 302);
  }

  if (resource.fileUrl) {
    return NextResponse.redirect(resource.fileUrl, 302);
  }

  return NextResponse.json({ error: 'この特典にはまだファイルが設定されていません' }, { status: 404 });
}
