import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { courseResources, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/session';
import { canOpenCourse } from '@/lib/journeyState';
import { getBucket } from '@/lib/storage';

/**
 * The only way a member reaches a perk.
 *
 * Access is re-checked here rather than trusted from the page that rendered
 * the link, and the destination is never written into the HTML — an R2 file
 * is streamed from the bucket by this route (never from a public URL), and an
 * external link is only revealed to someone who has access right now.
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

  const hasAccess = await canOpenCourse(process.env.DB as unknown as D1Database, userId, {
    id: resource.courseId,
    requiredPlanId: resource.requiredPlanId,
  });
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (resource.objectKey) {
    const bucket = getBucket();
    if (!bucket) {
      return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });
    }
    const object = await bucket.get(resource.objectKey);
    if (!object) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 404 });
    }
    const name = resource.fileName || resource.objectKey.split('/').pop() || 'download';
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
        'Content-Length': String(object.size),
        // Always a download, never rendered inline from this origin.
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  if (resource.fileUrl) {
    return NextResponse.redirect(resource.fileUrl, 302);
  }

  return NextResponse.json({ error: 'この特典にはまだファイルが設定されていません' }, { status: 404 });
}
