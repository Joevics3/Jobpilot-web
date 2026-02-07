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

    // Fetch Companies
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (companies) {
      companies.forEach((company) => {
        routes.push({
          url: `${siteUrl}/company/${company.slug}`,
          lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      });
    }

    // Fetch Blog Posts
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (posts) {
      posts.forEach((post) => {
        routes.push({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      });
    }

    console.log(`📄 Content sitemap: ${routes.length} companies/posts`);
  } catch (error) {
    console.error('Error generating content sitemap:', error);
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