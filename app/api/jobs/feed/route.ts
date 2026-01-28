import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/job-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100); // Cap at 100
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const remote = searchParams.get('remote') ? searchParams.get('remote') === 'true' : undefined;
    const source = searchParams.get('source') || '';

    const filters = {
      search: search || undefined,
      location: location || undefined,
      remote,
      source: source || undefined
    };

    const result = await jobService.getJobs(page, limit, filters);

    const feedItems = result.jobs.map(job => ({
      id: job.id,
      title: `${job.title} at ${job.company}`,
      content_html: job.description,
      content_text: job.description?.replace(/<[^>]*>/g, ''),
      url: job.source_url,
      date_published: job.posted_date,
      date_modified: job.updated_at || job.posted_date,
      author: {
        name: job.company
      },
      tags: [
        ...(job.skills || []),
        job.job_type,
        job.remote ? 'remote' : 'onsite',
        job.location
      ].filter(Boolean),
      salary: job.salary_min || job.salary_max ? {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.salary_currency
      } : undefined,
      _meta: {
        location: job.location,
        job_type: job.job_type,
        remote: job.remote,
        experience_level: job.experience_level,
        source: job.source,
        expires_date: job.expires_date
      }
    }));

    const baseUrl = request.nextUrl.origin;
    const currentPage = page;
    const totalPages = Math.ceil(result.total / limit);
    
    const nextUrl = currentPage < totalPages 
      ? `${baseUrl}/api/jobs/feed?page=${currentPage + 1}&limit=${limit}${location ? `&location=${encodeURIComponent(location)}` : ''}${remote ? '&remote=true' : ''}${source ? `&source=${encodeURIComponent(source)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`
      : null;

    const feed = {
      version: "https://jsonfeed.org/version/1.0",
      title: "JobPilot Jobs Feed",
      home_page_url: baseUrl,
      feed_url: `${baseUrl}/api/jobs/feed`,
      items: feedItems,
      _meta: {
        total_items: result.total,
        page: currentPage,
        limit: limit,
        total_pages: totalPages,
        next_url: nextUrl
      }
    };

    const response = NextResponse.json(feed);
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    response.headers.set('Last-Modified', new Date().toUTCString());
    
    return response;
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}