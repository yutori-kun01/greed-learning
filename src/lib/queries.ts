import 'server-only';

import { cache } from 'react';

import { getDb } from '@/db';
import {
  blogPosts,
  bookmarks,
  courseResources,
  courses,
  plans,
  siteSettings,
  user,
  categories,
} from '@/db/schema';
import { eq, inArray, asc, ne, desc, and, isNotNull } from 'drizzle-orm';
import { requireAdmin, requireUser } from '@/lib/session';

/**
 * Read paths for Server Components.
 *
 * These used to live in `'use server'` files, where every exported function
 * becomes a callable endpoint. That made the whole post table — drafts and
 * the full body of paid posts included — reachable without any authorization
 * check, along with the download URLs of every course's bonus resources.
 * Plain server-only functions cannot be invoked from outside the server.
 */

const db = () => getDb(process.env.DB as unknown as D1Database);

// ---------------------------------------------------------------- posts

/** Admin-only: includes drafts. */
export async function getPostsForAdmin() {
  await requireAdmin();
  return db().select().from(blogPosts).orderBy(blogPosts.createdAt);
}

/** Listing for readers. Never selects `content` — the body is per-post gated. */
export async function getPublishedPostSummaries() {
  return db()
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      status: blogPosts.status,
      price: blogPosts.price,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .where(ne(blogPosts.status, 'DRAFT'))
    .orderBy(blogPosts.createdAt);
}

// Memoized per request: the post page and its metadata both read it.
export const getPostBySlug = cache(async (slug: string) => {
  const rows = await db().select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return rows[0] || null;
});

// -------------------------------------------------------------- courses

export async function getCoursesForAdmin() {
  await requireAdmin();
  return db().select().from(courses).orderBy(courses.createdAt);
}

export async function getPublishedCourses() {
  return db().select().from(courses).where(eq(courses.status, 'PUBLISHED')).orderBy(courses.createdAt);
}

// ---------------------------------------------------------------- plans

export async function getPlansForAdmin() {
  await requireAdmin();
  return db().select().from(plans).orderBy(plans.sortOrder);
}

/** Safe to show to any visitor: name, price and interval only. */
export async function getActivePlans() {
  return db()
    .select({
      id: plans.id,
      name: plans.name,
      description: plans.description,
      price: plans.price,
      interval: plans.interval,
      sortOrder: plans.sortOrder,
    })
    .from(plans)
    // Only plans members can buy. Manual plans are assigned by an admin and
    // have no Stripe price to check out with.
    .where(and(eq(plans.isActive, true), isNotNull(plans.stripePriceId)))
    .orderBy(plans.sortOrder);
}

// ------------------------------------------------------------ resources

export async function getCourseResourcesForAdmin(courseId: string) {
  await requireAdmin();
  return db()
    .select()
    .from(courseResources)
    .where(eq(courseResources.courseId, courseId))
    .orderBy(asc(courseResources.sortOrder));
}

/**
 * Callers must pass only course ids the member can actually access — see
 * getAccessibleCourseIds in lib/access.
 */
export async function getResourcesForCourses(courseIds: string[]) {
  if (courseIds.length === 0) return [];
  return db()
    .select()
    .from(courseResources)
    .where(inArray(courseResources.courseId, courseIds))
    .orderBy(asc(courseResources.sortOrder));
}

// ------------------------------------------------------------ bookmarks

export async function getMyBookmarkedCourseIds(): Promise<Set<string>> {
  const user = await requireUser();
  const rows = await db().select().from(bookmarks).where(eq(bookmarks.userId, user.id));
  return new Set(rows.map((r: { courseId: string }) => r.courseId));
}

export async function getMyBookmarkedCourses() {
  const user = await requireUser();
  const rows = await db().select().from(bookmarks).where(eq(bookmarks.userId, user.id));
  const courseIds = rows.map((r: { courseId: string }) => r.courseId);
  if (courseIds.length === 0) return [];
  return db().select().from(courses).where(inArray(courses.id, courseIds));
}

// ---------------------------------------------------------------- users

export async function getUsers() {
  await requireAdmin();

  const users = await db().select().from(user).orderBy(desc(user.createdAt));
  const allPlans = await db().select({ id: plans.id, name: plans.name }).from(plans);
  const planById = new Map(allPlans.map((p: { id: string; name: string }) => [p.id, p.name]));

  return users.map((u: Record<string, unknown>) => ({
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    role: u.role as 'ADMIN' | 'MEMBER',
    status: u.status as 'ACTIVE' | 'SUSPENDED',
    createdAt: u.createdAt as Date,
    lastActivityDate: u.lastActivityDate as string | null,
    planId: (u.planId as string | null) ?? null,
    planName: u.planId ? planById.get(u.planId as string) || null : null,
    subscriptionStatus: u.subscriptionStatus as string,
    noteId: (u.noteId as string | null) ?? null,
    totalPoints: (u.totalPoints as number) ?? 0,
    currentStreak: (u.currentStreak as number) ?? 0,
  }));
}

// --------------------------------------------------------- site settings

let warnedAboutSettings = false;

// generateMetadata and the layout body both read this, and so does every
// nested layout — one query per request rather than one per caller.
/** Course categories in display order. Not secret; used by members and admin. */
export const getCategories = cache(async () => {
  try {
    return await db()
      .select({ id: categories.id, name: categories.name, sortOrder: categories.sortOrder })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.createdAt));
  } catch {
    return [];
  }
});

export const getSiteSettingsQuery = cache(async () => {
  try {
    const rows = await db().select().from(siteSettings).where(eq(siteSettings.id, '1')).limit(1);
    return rows[0] || null;
  } catch (err) {
    // The root layout reads this while prerendering the few static pages, when
    // no D1 binding exists, and on a fresh deploy before migrations have run.
    // Both must fall back to defaults rather than fail the render — but say so,
    // instead of making a real outage look like an unconfigured site. Once per
    // process: every prerendered page would otherwise repeat it.
    if (!warnedAboutSettings) {
      warnedAboutSettings = true;
      console.error('[settings] Could not read site settings; falling back to defaults.', err);
    }
    return null;
  }
});
