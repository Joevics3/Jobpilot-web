import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const FIELDS = 'id, slug, title, company, location, country, salary_range, employment_type, posted_date, created_at, sector, role_category, job_type, role, related_roles, ai_enhanced_roles, skills_required, ai_enhanced_skills, experience_level';
const CACHE_TTL = 1800;      // 30 minutes — unchanged
const CACHE_KEY = 'jobs:all';

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
    // ── 1. Check Redis cache ──────────────────────────────────────────────
    const raw = await redis.get(CACHE_KEY);

    if (raw) {
      // ✅ FIX: manually parse — avoids Upstash auto-serialization mismatch
      const jobs = typeof raw === 'string' ? JSON.parse(raw) : raw;
      console.log(`[jobs-api] Cache HIT — ${jobs.length} jobs`);
      return NextResponse.json(
        { jobs, total: jobs.length, source: 'cache' },
        { headers: { 'Cache-Control': 'no-store' } }
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

    // ✅ FIX: manually stringify before writing — guarantees data is stored correctly
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(jobs));
    console.log(`[jobs-api] Cached ${jobs.length} jobs in Redis for ${CACHE_TTL}s`);

    return NextResponse.json(
      { jobs, total: jobs.length, source: 'supabase' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[jobs-api] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}