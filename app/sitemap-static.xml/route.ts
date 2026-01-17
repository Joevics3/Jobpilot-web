import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';

export async function GET() {
  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/jobs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/company`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

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
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

export const revalidate = 86400;