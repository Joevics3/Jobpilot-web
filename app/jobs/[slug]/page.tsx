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

  // FIX: Handle undefined/null salary values properly
  const getSalaryString = () => {
    if (job.salary) return job.salary;
    
    if (job.salary_range && typeof job.salary_range === 'object') {
      const { min, max, currency } = job.salary_range;
      
      // Only return salary if we have currency AND at least one value
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
    
    return null; // Return null instead of undefined
  };

  const salaryStr = getSalaryString();

  // FIX: Remove duplicate "JobMeter" - only ONE at the end
  const title = `${job.title} at ${companyName}`;
  
  // FIX: Don't include salary if it's null/undefined
  let description = `Apply for ${job.title} at ${companyName} in ${locationStr}`;
  
  // Only add salary if it exists and isn't null
  if (salaryStr) {
    description += `. Salary: ${salaryStr}`;
  }
  
  description += '. Apply now on JobMeter.';
  
  // Ensure description is within optimal length (120-155 chars)
  if (description.length > 155) {
    if (salaryStr) {
      // Try without salary
      description = `Apply for ${job.title} at ${companyName} in ${locationStr}. Apply now on JobMeter.`;
    }
    
    // If still too long, truncate job title
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

async function fetchRelatedJobs(currentJob: any) {
  const supabase = createClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let relatedJobs: any[] = [];

  // First, try to get jobs by category
  if (currentJob.category) {
    const { data: categoryJobs, error: catError } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date, created_at')
      .eq('category', currentJob.category)
      .eq('status', 'active')
      .neq('id', currentJob.id)
      .or(`posted_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]},created_at.gte.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(6);

    if (catError) {
      console.error('Error fetching category jobs:', catError);
    }

    if (categoryJobs && categoryJobs.length > 0) {
      relatedJobs = categoryJobs;
      console.log(`Found ${categoryJobs.length} related jobs by category: ${currentJob.category}`);
    }
  }

  // If we have less than 6 jobs, supplement with sector-based jobs
  if (relatedJobs.length < 6 && currentJob.sector) {
    const excludeIds = [currentJob.id, ...relatedJobs.map(job => job.id)];

    const { data: sectorJobs, error: sectorError } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date, created_at')
      .eq('sector', currentJob.sector)
      .eq('status', 'active')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .or(`posted_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]},created_at.gte.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(6 - relatedJobs.length);

    if (sectorError) {
      console.error('Error fetching sector jobs:', sectorError);
    }

    if (sectorJobs && sectorJobs.length > 0) {
      relatedJobs = [...relatedJobs, ...sectorJobs];
      console.log(`Added ${sectorJobs.length} related jobs by sector: ${currentJob.sector}`);
    }
  }

  // If still less than 6, get any recent active jobs
  if (relatedJobs.length < 6) {
    const excludeIds = [currentJob.id, ...relatedJobs.map(job => job.id)];
    
    const { data: recentJobs, error: recentError } = await supabase
      .from('jobs')
      .select('id, slug, title, company, location, salary_range, posted_date, created_at')
      .eq('status', 'active')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .or(`posted_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]},created_at.gte.${thirtyDaysAgo.toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(6 - relatedJobs.length);

    if (recentError) {
      console.error('Error fetching recent jobs:', recentError);
    }

    if (recentJobs && recentJobs.length > 0) {
      relatedJobs = [...relatedJobs, ...recentJobs];
      console.log(`Added ${recentJobs.length} recent jobs`);
    }
  }

  console.log(`Total related jobs: ${relatedJobs.length}`);
  
  // Ensure all jobs have required fields
  const validJobs = relatedJobs.filter(job => job && job.slug && job.title);
  
  if (validJobs.length !== relatedJobs.length) {
    console.warn(`Filtered out ${relatedJobs.length - validJobs.length} invalid jobs`);
  }

  // Limit to maximum of 6 jobs
  return validJobs.slice(0, 6);
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