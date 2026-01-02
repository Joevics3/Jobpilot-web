import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch public job listings for sitemap
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, updated_at')
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to most recent 1000 jobs

      if (!error && jobs) {
        const jobRoutes = jobs.map((job) => ({
          url: `${siteUrl}/jobs/${job.id}`,
          lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));

        routes.push(...jobRoutes);
      }
    }
  } catch (error) {
    console.error('Error fetching jobs for sitemap:', error);
    // Continue without job routes if there's an error
  }

  return routes;
}

