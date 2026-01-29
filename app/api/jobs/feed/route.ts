import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to avoid import issues
const getJobService = async () => {
  try {
    const { jobService } = await import('@/lib/job-service');
    return jobService;
  } catch (error) {
    console.error('Failed to import jobService:', error);
    throw error;
  }
};

// Format date for RSS (RFC 822)
const formatRSSDate = (dateString?: string) => {
  if (!dateString) return new Date().toUTCString();
  return new Date(dateString).toUTCString();
};

// Escape XML special characters
const escapeXML = (text?: any) => {
  if (text === null || text === undefined) return '';
  const str = String(text); // Convert to string
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export async function GET(request: NextRequest) {
  try {
    console.log('RSS Feed API called');
    
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100); // Cap at 100
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const remote = searchParams.get('remote') ? searchParams.get('remote') === 'true' : undefined;
    const source = searchParams.get('source') || '';

    console.log('Filters:', { page, limit, search, location, remote, source });

    const filters = {
      search: search || undefined,
      location: location || undefined,
      remote,
      source: source || undefined
    };

    console.log('Getting jobService instance...');
    const jobService = await getJobService();
    console.log('Calling jobService.getJobs...');
    const result = await jobService.getJobs(page, limit, filters);
    console.log('JobService result:', { jobsCount: result.jobs?.length, total: result.total });
    
    // Log first job structure for debugging
    if (result.jobs && result.jobs.length > 0) {
      console.log('First job structure:', JSON.stringify(result.jobs[0], null, 2));
    }

    const baseUrl = request.nextUrl.origin;

    // Generate RSS XML
    const rssItems = result.jobs.map(job => {
      const title = `${escapeXML(job.title || '')} at ${escapeXML(job.company || '')}`;
      const link = escapeXML(job.source_url || `${baseUrl}/jobs/${job.id}`);
      
      // Build description with job details safely
      let fullDescription = `<![CDATA[<p><strong>${escapeXML(job.title || '')}</strong> at ${escapeXML(job.company || '')}</p>`;
      if (job.location) fullDescription += `<p><strong>Location:</strong> ${escapeXML(job.location)}</p>`;
      if (job.job_type) fullDescription += `<p><strong>Type:</strong> ${escapeXML(job.job_type)}</p>`;
      if (job.remote) fullDescription += `<p><strong>Remote:</strong> Yes</p>`;
      if (job.salary_min || job.salary_max) {
        const salary = job.salary_min && job.salary_max 
          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
          : job.salary_min 
          ? `$${job.salary_min.toLocaleString()}+`
          : `$${job.salary_max?.toLocaleString()}`;
        fullDescription += `<p><strong>Salary:</strong> ${escapeXML(salary)}</p>`;
      }
      if (job.description) {
        const cleanDescription = String(job.description).replace(/<[^>]*>/g, '');
        fullDescription += `<p><strong>Description:</strong></p><div>${escapeXML(cleanDescription)}</div>`;
      }
      if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
        fullDescription += `<p><strong>Skills:</strong> ${escapeXML(job.skills.join(', '))}</p>`;
      }
      fullDescription += ']]>';

      const categories = [];
      if (job.location) categories.push(`<category>${escapeXML(job.location)}</category>`);
      if (job.job_type) categories.push(`<category>${escapeXML(job.job_type)}</category>`);
      if (job.remote) categories.push(`<category>Remote</category>`);
      if (job.skills && Array.isArray(job.skills)) {
        job.skills.forEach(skill => {
          if (skill) categories.push(`<category>${escapeXML(skill)}</category>`);
        });
      }

      return `
  <item>
    <title>${title}</title>
    <link>${link}</link>
    <description>${fullDescription}</description>
    <pubDate>${formatRSSDate(job.posted_date)}</pubDate>
    <guid>${escapeXML(job.id)}</guid>
    <author>${escapeXML(job.company || '')}</author>
    ${categories.join('\n    ')}
  </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>JobPilot Jobs Feed</title>
    <link>${escapeXML(baseUrl)}</link>
    <description>Latest job listings from JobPilot</description>
    <language>en-us</language>
    <atom:link href="${escapeXML(`${baseUrl}/api/jobs/feed`)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${formatRSSDate()}</lastBuildDate>
    <generator>JobPilot RSS Feed Generator</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;

    const response = new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'Last-Modified': new Date().toUTCString(),
      },
    });
    
    return response;
  } catch (error) {
    console.error('RSS Feed API error:', error);
    console.error('Error type:', typeof error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    // Return XML error response
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error</title>
    <description>Failed to generate RSS feed</description>
    <item>
      <title>Feed Generation Error</title>
      <description>Error: ${escapeXML(errorMessage)}</description>
      <pubDate>${formatRSSDate()}</pubDate>
    </item>
  </channel>
</rss>`;

    return new NextResponse(errorXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    });
  }
}