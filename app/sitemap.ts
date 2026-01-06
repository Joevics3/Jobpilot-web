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
    {
      url: `${siteUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Fetch blog posts for sitemap
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false });

      if (!blogError && blogPosts) {
        const blogRoutes = blogPosts.map((post) => ({
          url: `${siteUrl}/resources/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));

        routes.push(...blogRoutes);
      }
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    // Continue without blog routes if there's an error
  }

  // Fetch public job listings for sitemap
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Get jobs with slugs first, then fallback to ID-based URLs for jobs without slugs
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, slug, updated_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error && jobs) {
        const jobRoutes = jobs.map((job) => ({
          // Use slug if available, otherwise use ID (backward compatibility)
          url: `${siteUrl}/jobs/${job.slug || job.id}`,
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