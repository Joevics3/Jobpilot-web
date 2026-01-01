import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

type Props = {
  params: { id: string };
};

async function getJob(id: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob(params.id);

  if (!job) {
    return {
      title: 'Job Not Found - JobMeter',
      description: 'The job you are looking for could not be found.',
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
      canonical: `/jobs/${params.id}`,
    },
  };
}

export default function JobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}












