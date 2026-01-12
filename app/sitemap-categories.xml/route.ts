import { createClient } from '@supabase/supabase-js';
import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

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

    // Fetch ALL category pages (no limit - can handle thousands)
    const { data: categoryPages, error } = await supabase
      .from('category_pages')
      .select('slug, updated_at, location, job_count')
      .eq('is_published', true)
      .order('job_count', { ascending: false }); // Most popular first

    if (error) {
      console.error('Error fetching category pages:', error);
      return new Response('Error fetching category pages', { status: 500 });
    }

    if (categoryPages && categoryPages.length > 0) {
      categoryPages.forEach((page) => {
        routes.push({
          url: `${siteUrl}/resources/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'daily', // Categories update 1-2 times daily when jobs are posted
          priority: page.location ? 0.7 : 0.8, // National pages get higher priority
        });
      });

      console.log(`📄 Category sitemap: ${routes.length} pages`);
    }
  } catch (error) {
    console.error('Error generating category sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }

  // Generate XML sitemap
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
      'Cache-Control': 'public, max-age=21600, s-maxage=21600', // Cache for 6 hours
    },
  });
}

// Revalidate every 6 hours (categories update when jobs are posted in batches)
export const revalidate = 21600;