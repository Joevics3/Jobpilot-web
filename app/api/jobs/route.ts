import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const FIELDS = 'id, slug, title, company, location, country, salary_range, employment_type, posted_date, created_at, sector, role_category, description, job_type';
const REVALIDATE_SECONDS = 900; // 15 minutes — fresh enough for multiple daily additions

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Cached fetcher — one Supabase call per unique param combination ──────────
// Cache key includes country + jobType + posted so each page variant is cached separately
function makeCachedFetcher(country: string, jobType: string, postedToday: boolean, state: string = '', town: string = '') {
  const cacheKey = `jobs-${country || 'all'}-${jobType || 'all'}-${state || 'all'}-${town || 'all'}-${postedToday ? 'today' : '30d'}`;

  return unstable_cache(
    async () => {
      const supabase = getSupabase();

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('jobs')
        .select(FIELDS)
        .eq('status', 'active')
        .gte('posted_date', postedToday ? todayStr : thirtyDaysAgoStr)
        .order('posted_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(0, 1999); // up to 2000 jobs

      if (country) {
        query = query.or(`country.cs.{"${country}"},country.cs.{"Global"}`);
      }

      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      // ✅ State and town array-contains filters
      if (state) {
        query = query.contains('state', [state]);
      }

      if (town) {
        query = query.contains('town', [town]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Jobs API cache fetch error:', error);
        return [];
      }

      console.log(`[jobs-cache] Fetched ${data?.length || 0} jobs (key: ${cacheKey})`);
      return data || [];
    },
    [cacheKey],
    { revalidate: REVALIDATE_SECONDS }
  );
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country   = searchParams.get('country')   || '';
    const jobType   = searchParams.get('jobType')   || '';
    const state     = searchParams.get('state')     || '';
    const town      = searchParams.get('town')      || '';
    const postedToday = searchParams.get('posted') === 'today';
    const from      = parseInt(searchParams.get('from') || '0');
    const to        = parseInt(searchParams.get('to')   || '49');

    const fetchJobs = makeCachedFetcher(country, jobType, postedToday, state, town);
    const allJobs   = await fetchJobs();

    // Slice server-side so the browser only downloads what it needs per page
    const slice = allJobs.slice(from, to + 1);
    const total = allJobs.length;

    return NextResponse.json(
      { jobs: slice, total },
      {
        headers: {
          // Also tell the browser/CDN to cache — stale-while-revalidate keeps it snappy
          'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}