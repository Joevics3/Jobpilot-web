import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapJobToSchema } from '@/lib/mapJobToSchema';
import JobClient from './JobClient';
import { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const supabase = createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!job) {
    return { title: 'Job Not Found - JobMeter' };
  }

  const companyName =
    typeof job.company === 'string'
      ? job.company
      : job.company?.name || 'Company';

  const location =
    typeof job.location === 'string'
      ? job.location
      : job.location?.city || 'Nigeria';

  const title = `${job.title} Job in ${location} | JobMeter`;
  const description = `Apply for ${job.title} jobs in ${location} at ${companyName}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://jobmeter.ng/jobs/${job.slug}`,
    },
  };
}

export default async function JobPage(
  { params }: { params: { slug: string } }
) {
  const supabase = createClient();

  // 🔒 ONLY fetch by slug
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!job) {
    notFound();
  }

  const schema = mapJobToSchema(job);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
      <JobClient job={job} />
    </>
  );
}
