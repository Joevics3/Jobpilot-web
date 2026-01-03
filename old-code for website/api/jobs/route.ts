import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/job-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
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

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}