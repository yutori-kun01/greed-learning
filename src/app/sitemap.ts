import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/posts';

/**
 * Public pages only. Member-only articles are excluded: their body is not
 * served to a crawler, so listing them would only produce thin pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
  if (!appUrl) return [];

  const staticPaths = ['', '/login', '/signup', '/legal/tokushoho', '/legal/terms', '/legal/privacy'];

  const posts = (await getPublishedPosts()).filter(
    (post) => post.status === 'PUBLISHED' || post.status === 'PAID'
  );

  return [
    ...staticPaths.map((path) => ({
      url: `${appUrl}${path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.5,
    })),
    ...posts.map((post) => ({
      url: `${appUrl}/posts/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
