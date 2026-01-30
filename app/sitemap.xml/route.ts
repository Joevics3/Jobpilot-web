// app/sitemap.xml/route.ts
// Main sitemap index that references all child sitemaps

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

/**
 * Generates the main sitemap index XML that references all child sitemaps.
 * This follows the Sitemap Protocol specification for sitemap index files.
 * @see https://www.sitemaps.org/protocol.html#index
 */
export async function GET() {
  try {
    const currentDate = new Date().toISOString();
    
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-static.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-categories.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-jobs.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-content.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-locations.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new Response(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=21600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new Response('Error generating sitemap index', { status: 500 });
  }
}

// Revalidate the sitemap index every hour
export const revalidate = 21600;