import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Countries blocked from /jobs/* — no real users, only bots
const BLOCKED_COUNTRIES = new Set(['SG']);

// Rate limit: 30 req/min, then 5 min ban
const RATE_LIMIT   = 30;
const WINDOW_MS    = 60;   // seconds
const BAN_DURATION = 300;  // seconds

// Detect bots by user agent
const BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'scraper', 'python-requests',
  'curl', 'wget', 'jobbot', 'jobspider', 'scrapy', 'axios', 'node-fetch',
];

export async function middleware(request: NextRequest) {
  const pathname  = request.nextUrl.pathname;
  const country   = request.geo?.country || 'unknown';
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // ── 1. Skip static assets ──────────────────────────────────────────────
  if (pathname.match(/\.(jpg|jpeg|png|gif|css|js|ico|svg|woff|woff2)$/)) {
    return NextResponse.next();
  }

  // ── 2. Hard country block on /jobs/* ──────────────────────────────────
  if (BLOCKED_COUNTRIES.has(country) && pathname.startsWith('/jobs/')) {
    console.log(`[middleware] Blocked country ${country}: ${ip} → ${pathname}`);
    return new NextResponse('Access restricted in your region.', { status: 403 });
  }

  // ── 3. Bot user-agent block ────────────────────────────────────────────
  const isBot = BOT_PATTERNS.some(p => userAgent.includes(p));
  if (isBot && !userAgent.includes('googlebot') && !userAgent.includes('bingbot')) {
    console.log(`[middleware] Blocked bot: ${userAgent.substring(0, 50)} from ${ip}`);
    return new NextResponse('Forbidden - Bot detected', { status: 403 });
  }

  // ── 4. Redis-backed rate limiting (works across all serverless instances) ──
  // Skip rate limiting for unknown IPs to avoid Redis noise
  if (ip === 'unknown') return NextResponse.next();

  try {
    const banKey   = `ban:${ip}`;
    const countKey = `rate:${ip}`;

    // Check if IP is currently banned
    const banned = await redis.get(banKey);
    if (banned) {
      console.log(`[middleware] Banned IP: ${ip}`);
      return new NextResponse('Too Many Requests - You are temporarily blocked.', {
        status: 429,
        headers: { 'Retry-After': '300' },
      });
    }

    // Increment request count with a 60s sliding window
    const count = await redis.incr(countKey);
    if (count === 1) {
      // First request in this window — set expiry
      await redis.expire(countKey, WINDOW_MS);
    }

    if (count > RATE_LIMIT) {
      // Ban this IP for 5 minutes
      await redis.set(banKey, '1', { ex: BAN_DURATION });
      await redis.del(countKey);
      console.log(`[middleware] Rate limit exceeded — banned ${ip} (${country}), count: ${count}, path: ${pathname}`);
      return new NextResponse('Too Many Requests - You have been temporarily blocked.', {
        status: 429,
        headers: {
          'Retry-After': '300',
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  } catch (err) {
    // If Redis is down, fail open — don't block real users
    console.error('[middleware] Redis error:', err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};