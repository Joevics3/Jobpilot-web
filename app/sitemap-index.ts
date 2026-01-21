import { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

/**
 * Sitemap INDEX
 * This file must return MetadataRoute.SitemapIndex
 * and must ONLY list child sitemap URLs
 */
export default function sitemap(): MetadataRoute.SitemapIndex {
  return [
    {
      // Rarely changes
      url: `${siteUrl}/sitemap-static.xml`,
      lastModified: new Date('2026-01-01'),
    },
    {
      // Changes when categories/jobs change
      url: `${siteUrl}/sitemap-categories.xml`,
      lastModified: new Date(),
    },
    {
      // High-churn sitemap (new jobs daily)
      url: `${siteUrl}/sitemap-jobs.xml`,
      lastModified: new Date(),
    },
    {
      // Companies + blog posts
      url: `${siteUrl}/sitemap-content.xml`,
      lastModified: new Date(),
    },
  ];
}
