import type { MetadataRoute } from 'next';

/**
 * Only the public surface is crawlable: the member area, the admin screens and
 * the API are all behind auth and have nothing to offer a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/dashboard', '/learning', '/bookmarks', '/resources', '/settings', '/support'],
    },
    sitemap: appUrl ? `${appUrl.replace(/\/+$/, '')}/sitemap.xml` : undefined,
  };
}
