import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const FIELDS = 'id, slug, title, company, location, country, salary_range, employment_type, posted_date, created_at, sector, role_category, job_type, role, related_roles, ai_enhanced_roles, skills_required, ai_enhanced_skills, experience_level';
const CACHE_TTL = 1800;      // 30 minutes
const CACHE_KEY = 'jobs:all'; // single key — one cache entry for all 2000 jobs

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    // ── 1. Check Redis cache ───────────────────────────────────────────────
    const cached = await redis.get<any[]>(CACHE_KEY);

    if (cached) {
      console.log(`[jobs-api] Cache HIT — ${cached.length} jobs from Redis`);
      return NextResponse.json(
        { jobs: cached, total: cached.length, source: 'cache' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=120',
            'Vary': 'Accept-Encoding',
          },
        }
      );
    }

    // ── 2. Cache miss — fetch from Supabase ───────────────────────────────
    console.log('[jobs-api] Cache MISS — fetching from Supabase');

    const supabase = getSupabase();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('jobs')
      .select(FIELDS)
      .eq('status', 'active')
      .gte('posted_date', thirtyDaysAgoStr)
      .order('posted_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, 1999);

    if (error) {
      console.error('[jobs-api] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    const jobs = data || [];

    // ── 3. Store in Redis for 30 minutes ──────────────────────────────────
    await redis.set(CACHE_KEY, jobs, { ex: CACHE_TTL });
    console.log(`[jobs-api] Cached ${jobs.length} jobs in Redis (TTL: ${CACHE_TTL}s)`);

    return NextResponse.json(
      { jobs, total: jobs.length, source: 'supabase' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=120',
          'Vary': 'Accept-Encoding',
        },
      }
    );
  } catch (error) {
    console.error('[jobs-api] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}