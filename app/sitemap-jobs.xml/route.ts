import { createClient } from '@supabase/supabase-js';
import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';
const MAX_JOBS_PER_SITEMAP = 5000;

export async function GET() {
  const routes: MetadataRoute.Sitemap = [];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found');
      return new Response('Missing Supabase credentials', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, slug, updated_at, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(MAX_JOBS_PER_SITEMAP);

    if (error) {
      console.error('Error fetching jobs:', error);
      return new Response('Error fetching jobs', { status: 500 });
    }

    if (jobs && jobs.length > 0) {
      jobs.forEach((job) => {
        routes.push({
          url: `${siteUrl}/jobs/${job.slug || job.id}`,
          lastModified: job.updated_at ? new Date(job.updated_at) : new Date(job.created_at),
          changeFrequency: 'daily',
          priority: 0.7,
        });
      });
      console.log(`📄 Jobs sitemap: ${routes.length} active jobs`);
    }
  } catch (error) {
    console.error('Error generating jobs sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${new Date(route.lastModified || new Date()).toISOString()}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export const revalidate = 3600;