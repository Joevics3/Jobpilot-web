import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapJobToSchema } from '@/lib/mapJobToSchema';
import JobClient from './JobClient';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  
  const slugOrId = params.id;
  
  // Try to find job by slug first, then fallback to ID
  let job = null;
  
  // Method 1: Try finding by slug
  const { data: jobBySlug, error: slugError } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slugOrId)
    .single();
    
  if (!slugError && jobBySlug) {
    job = jobBySlug;
  } else {
    // Method 2: Try finding by ID
    const { data: jobById, error: idError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', slugOrId)
      .single();
      
    if (!idError && jobById) {
      job = jobById;
    }
  }

  if (!job) {
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
      canonical: `/jobs/${job.slug || job.id}`, // Use slug if available
    },
  };
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const slugOrId = params.id;
  
  // Try to find job by slug first (new system), then fallback to ID (old system)
  let job = null;
  let error = null;
  
  // Method 1: Try finding by slug (for new SEO-friendly URLs)
  const { data: jobBySlug, error: slugError } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slugOrId)
    .single();
    
  if (!slugError && jobBySlug) {
    job = jobBySlug;
  } else {
    // Method 2: Try finding by ID (for backward compatibility)
    const { data: jobById, error: idError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', slugOrId)
      .single();
      
    if (!idError && jobById) {
      job = jobById;
    }
    error = idError;
  }

  if (error || !job) {
    notFound();
  }

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
      <JobClient job={job} />
    </>
  );
}