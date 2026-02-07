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
      description: 'The job you are looking for could not be found. Browse more jobs on JobMeter.',
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

  const getSalaryString = () => {
    if (job.salary) return job.salary;
    
    if (job.salary_range && typeof job.salary_range === 'object') {
      const { min, max, currency } = job.salary_range;
      
      if (currency && (min || max)) {
        if (min && max) {
          return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
        } else if (min) {
          return `${currency} ${min.toLocaleString()}`;
        } else if (max) {
          return `${currency} ${max.toLocaleString()}`;
        }
      }
    }
    
    return null;
  };

  const salaryStr = getSalaryString();
  const title = `${job.title} at ${companyName}`;
  
  let description = `Apply for ${job.title} at ${companyName} in ${locationStr}`;
  
  if (salaryStr) {
    description += `. Salary: ${salaryStr}`;
  }
  
  description += '. Apply now on JobMeter.';
  
  if (description.length > 155) {
    if (salaryStr) {
      description = `Apply for ${job.title} at ${companyName} in ${locationStr}. Apply now on JobMeter.`;
    }
    
    if (description.length > 155) {
      const maxTitleLength = 155 - `Apply for  at ${companyName} in ${locationStr}. Apply now!`.length;
      const truncatedTitle = job.title.length > maxTitleLength 
        ? job.title.substring(0, maxTitleLength - 3) + '...'
        : job.title;
      description = `Apply for ${truncatedTitle} at ${companyName} in ${locationStr}. Apply now!`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'JobMeter',
      url: `https://www.jobmeter.app/jobs/${job.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.jobmeter.app/jobs/${job.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

async function incrementViewCount(slug: string) {
  const supabase = createClient();
  try {
    await supabase.rpc('increment_job_views', { job_slug: slug });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

async function fetchRelatedJobs(currentJob: any) {
  const supabase = createClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let relatedJobs: any[] = [];
  const MAX_JOBS = 10;

  // First, fetch jobs by category (up to 8)
  if (currentJob.category) {
    const { data: categoryJobs, error: catError } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date, created_at, category, sector')
      .eq('category', currentJob.category)
      .eq('status', 'active')
      .neq('id', currentJob.id)
      .or(`posted_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]},created_at.gte.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!catError && categoryJobs && categoryJobs.length > 0) {
      relatedJobs = categoryJobs;
    }
  }

  // If less than MAX_JOBS, fetch jobs by sector
  if (relatedJobs.length < MAX_JOBS && currentJob.sector) {
    const excludeIds = [currentJob.id, ...relatedJobs.map(job => job.id)];
    const remainingSlots = MAX_JOBS - relatedJobs.length;

    const { data: sectorJobs, error: sectorError } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date, created_at, category, sector')
      .eq('sector', currentJob.sector)
      .eq('status', 'active')
      .neq('id', currentJob.id)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .or(`posted_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]},created_at.gte.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(remainingSlots);

    if (!sectorError && sectorJobs && sectorJobs.length > 0) {
      relatedJobs = [...relatedJobs, ...sectorJobs];
    }
  }

  const validJobs = relatedJobs.filter(job => job && job.slug && job.title);
  return validJobs.slice(0, MAX_JOBS);
}

export default async function JobPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  const { slug } = params;
  
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !job) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViewCount(params.slug);

  // Fetch related jobs
  const relatedJobs = await fetchRelatedJobs(job);

  const schema = mapJobToSchema(job);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <JobClient job={job} relatedJobs={relatedJobs} />
    </>
  );
}
