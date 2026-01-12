import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapJobToSchema } from '@/lib/mapJobToSchema';
import JobClient from './JobClient';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  
  const { slug } = params;
  
  // Find job by slug
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !job) {
    return {
      title: 'Job Not Found - JobMeter',
    };
  }

  const companyName = typeof job.company === 'string' 
    ? job.company 
    : (job.company?.name || 'Company');
  
  const locationStr = typeof job.location === 'string'
    ? job.location
    : (job.location?.remote 
        ? 'Remote'
        : [job.location?.city, job.location?.state, job.location?.country].filter(Boolean).join(', ') || 'Not specified');

  const salaryStr = job.salary || 
    (job.salary_range 
      ? `${job.salary_range.currency} ${job.salary_range.min} - ${job.salary_range.max}`
      : null);

  const title = `${job.title || 'Job'} at ${companyName} - JobMeter`;
  const description = `${job.title || 'Job'} position at ${companyName} in ${locationStr}.${salaryStr ? ` Salary: ${salaryStr}` : ''} ${job.description ? String(job.description).substring(0, 100) + '...' : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'JobMeter',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/jobs/${job.slug}`,
    },
  };
}

async function fetchRelatedJobs(currentJob: any) {
  const supabase = createClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let relatedJobs: any[] = [];

  // First, try to get jobs by category
  if (currentJob.category) {
    const { data: categoryJobs } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date')
      .eq('category', currentJob.category)
      .eq('status', 'active')
      .neq('id', currentJob.id)
      .gte('posted_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('posted_date', { ascending: false })
      .limit(6);

    if (categoryJobs) {
      relatedJobs = categoryJobs;
    }
  }

  // If we have less than 3 jobs, supplement with sector-based jobs
  if (relatedJobs.length < 3 && currentJob.sector) {
    const excludeIds = relatedJobs.map(job => job.id);
    excludeIds.push(currentJob.id);

    const { data: sectorJobs } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date')
      .eq('sector', currentJob.sector)
      .eq('status', 'active')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .gte('posted_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('posted_date', { ascending: false })
      .limit(6 - relatedJobs.length);

    if (sectorJobs) {
      relatedJobs = [...relatedJobs, ...sectorJobs];
    }
  }

  // Limit to maximum of 6 jobs
  return relatedJobs.slice(0, 6);
}

export default async function JobPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  const { slug } = params;
  
  // Find job by slug only (SEO-friendly)
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !job) {
    notFound();
  }

  // Fetch related jobs
  const relatedJobs = await fetchRelatedJobs(job);

  const schema = mapJobToSchema(job);

  return (
    <>
      {/* Server-rendered schema - visible to Google Jobs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {/* Client component handles all interactivity */}
      <JobClient job={job} relatedJobs={relatedJobs} />
    </>
  );
}