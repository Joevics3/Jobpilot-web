import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

/**
 * Main sitemap that tells Next.js about all child sitemaps.
 * This file should be at: app/sitemap.ts (NOT in a folder!)
 * 
 * Next.js will automatically generate the sitemap index XML at /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/sitemap-static.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/sitemap-jobs.xml`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/sitemap-categories.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sitemap-locations.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sitemap-content.xml`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}