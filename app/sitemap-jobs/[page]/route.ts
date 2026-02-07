import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';
const JOBS_PER_SITEMAP = 1000;

/**
 * Dynamic route handler for job sitemaps
 * Place at: app/sitemap-jobs/[page]/route.ts
 * 
 * Handles URLs like:
 * - /sitemap-jobs/1.xml
 * - /sitemap-jobs/2.xml
 */
export async function GET(
  request: Request,
  { params }: { params: { page: string } }
) {
  try {
    // Extract page number and remove .xml if present
    const pageParam = params.page.replace('.xml', '');
    const page = Number(pageParam);

    if (!page || page < 1) {
      return new Response('Invalid sitemap page', { status: 404 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found');
      return new Response('Missing Supabase credentials', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Calculate pagination range
    const from = (page - 1) * JOBS_PER_SITEMAP;
    const to = from + JOBS_PER_SITEMAP - 1;

    console.log(`📄 Fetching jobs sitemap page ${page}: range ${from}-${to}`);

    // Fetch jobs for this specific page
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, slug, updated_at, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching jobs:', error);
      return new Response('Error fetching jobs', { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log(`📄 Jobs sitemap page ${page}: No jobs found`);
      // Return empty but valid sitemap
      const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
      return new Response(emptySitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    console.log(`📄 Jobs sitemap page ${page}: ${jobs.length} jobs`);

    // Build sitemap XML
    const urls = jobs.map((job) => {
      const lastmod = job.updated_at ? new Date(job.updated_at) : new Date(job.created_at);
      return `  <url>
    <loc>${siteUrl}/jobs/${job.slug || job.id}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating jobs sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}

export const revalidate = 3600;
