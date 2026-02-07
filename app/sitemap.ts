import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';
const JOBS_PER_SITEMAP = 1000;

/**
 * Main sitemap that tells Next.js about all child sitemaps.
 * This file should be at: app/sitemap.ts (NOT in a folder!)
 * 
 * Next.js will automatically generate the sitemap index XML at /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // All non-job sitemaps remain unchanged
  const baseSitemaps: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/sitemap-static.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
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

  // Calculate how many job sitemaps we need
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found');
      return baseSitemaps;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get total count of active jobs
    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error || !count) {
      console.error('Error counting jobs:', error);
      return baseSitemaps;
    }

    // Calculate number of sitemap partitions needed
    const numberOfSitemaps = Math.ceil(count / JOBS_PER_SITEMAP);
    console.log(`📊 Total jobs: ${count}, Creating ${numberOfSitemaps} job sitemaps`);

    // Generate sitemap entries for each partition
    const jobSitemaps: MetadataRoute.Sitemap = Array.from(
      { length: numberOfSitemaps },
      (_, i) => ({
        url: `${siteUrl}/sitemap-jobs-${i + 1}.xml`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1,
      })
    );

    return [...baseSitemaps, ...jobSitemaps];
  } catch (error) {
    console.error('Error generating job sitemaps list:', error);
    return baseSitemaps;
  }
}
