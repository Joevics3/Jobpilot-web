import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

export const revalidate = 3600;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Missing Supabase credentials', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const urls: Array<{ url: string; lastmod: string; changefreq: string; priority: number }> = [
    // Country pages
    { url: `${siteUrl}/jobs/nigeria`,        lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/usa`,            lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/united-kingdom`, lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/uk`,             lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/uae`,            lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/canada`,         lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/australia`,      lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/germany`,        lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/new-zealand`,    lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/france`,         lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/spain`,          lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/jobs/remote`,         lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
    // State listing page
    { url: `${siteUrl}/jobs/state`,          lastmod: new Date().toISOString(), changefreq: 'daily',  priority: 0.8 },
  ];

  try {
    // State pages — only is_active = true
    const { data: statePages, error: stateError } = await supabase
      .from('location_state_pages')
      .select('full_path, updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (stateError) {
      console.error('Error fetching state pages for sitemap:', stateError);
    } else {
      for (const row of statePages || []) {
        urls.push({
          url: `${siteUrl}/jobs/Location/${row.full_path}`,
          lastmod: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.8,
        });
      }
    }

    // Town pages — only is_active = true
    const { data: townPages, error: townError } = await supabase
      .from('location_town_pages')
      .select('full_path, updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (townError) {
      console.error('Error fetching town pages for sitemap:', townError);
    } else {
      for (const row of townPages || []) {
        urls.push({
          url: `${siteUrl}/jobs/Location/${row.full_path}`,
          lastmod: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.7,
        });
      }
    }

    console.log(`📄 Location sitemap: ${urls.length} total URLs (${statePages?.length || 0} states, ${townPages?.length || 0} towns)`);

  } catch (error) {
    console.error('Error generating location sitemap:', error);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}