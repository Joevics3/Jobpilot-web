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

    // Fetch unique states from jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('location')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching jobs for locations:', error);
      return new Response('Error fetching jobs', { status: 500 });
    }

    if (jobs && jobs.length > 0) {
      const states = new Set<string>();
      const stateTowns: { [key: string]: Set<string> } = {};

      jobs.forEach(job => {
        if (job.location) {
          let state = '';
          let town = '';
          
          if (typeof job.location === 'string') {
            // Parse string location format
            const parts = job.location.split(',').map(p => p.trim());
            if (parts.length >= 2) {
              town = parts[0];
              state = parts[1];
            } else if (parts.length === 1) {
              state = parts[0];
            }
          } else if (job.location && typeof job.location === 'object') {
            // Handle object location format
            state = job.location.state || '';
            town = job.location.city || '';
          }

          if (state) {
            states.add(state);
            if (!stateTowns[state]) {
              stateTowns[state] = new Set();
            }
            if (town) {
              stateTowns[state].add(town);
            }
          }
        }
      });

      // Add state pages
      states.forEach(state => {
        const formattedState = state.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        routes.push({
          url: `${siteUrl}/jobs/state/${formattedState}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        });
      });

      // Add town pages
      Object.keys(stateTowns).forEach(state => {
        const formattedState = state.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        stateTowns[state].forEach(town => {
          const formattedTown = town.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          routes.push({
            url: `${siteUrl}/jobs/state/${formattedState}/${formattedTown}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          });
        });
      });

      console.log(`📄 Location sitemap: ${states.size} states, ${Object.values(stateTowns).reduce((acc, towns) => acc + towns.size, 0)} towns`);
    }
  } catch (error) {
    console.error('Error generating location sitemap:', error);
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