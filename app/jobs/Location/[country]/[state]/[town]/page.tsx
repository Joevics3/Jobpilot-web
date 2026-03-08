// app/jobs/Location/[country]/[state]/[town]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { MapPin, Briefcase, Building2, TrendingUp, DollarSign, HelpCircle, ExternalLink, Wifi, Car, BookOpen } from 'lucide-react';
import JobList from '@/components/jobs/JobList';
import { BreadcrumbListSchema } from '@/components/seo/StructuredData';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';
export const revalidate = 3600;
export const dynamicParams = true;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface PageParams {
  country: string;
  state: string;
  town: string;
}

async function getTownPage(countrySlug: string, stateSlug: string, townSlug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('location_town_pages')
    .select('*')
    .eq('country_slug', countrySlug)
    .eq('state_slug', stateSlug)
    .eq('slug', townSlug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateStaticParams() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('location_town_pages')
    .select('country_slug, state_slug, slug')
    .eq('is_active', true);

  return (data || []).map((row) => ({
    country: row.country_slug,
    state: row.state_slug,
    town: row.slug,
  }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const page = await getTownPage(params.country, params.state, params.town);
  if (!page) return { title: 'Jobs | JobMeter' };

  return {
    title: page.meta_title,
    description: page.meta_description,
    keywords: page.seo_keywords,
    alternates: {
      canonical: `${siteUrl}/jobs/Location/${page.full_path}`,
    },
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      url: `${siteUrl}/jobs/Location/${page.full_path}`,
      type: 'website',
    },
  };
}

export default async function TownJobsPage({ params }: { params: PageParams }) {
  const page = await getTownPage(params.country, params.state, params.town);
  if (!page) notFound();

  // Fetch active town slugs so we only link to pages that actually exist
  const supabase = getSupabase();
  const { data: activeTownRows } = await supabase
    .from('location_town_pages')
    .select('slug, state_slug, country_slug')
    .eq('is_active', true);
  const activeTownSlugs = new Set(
    (activeTownRows || []).map(r => `${r.country_slug}/${r.state_slug}/${r.slug}`)
  );

  const breadcrumbItems = [
    { name: 'Home', url: siteUrl },
    { name: 'Jobs', url: `${siteUrl}/jobs` },
    { name: page.country, url: `${siteUrl}/jobs/Location/${page.country_slug}` },
    { name: page.state, url: `${siteUrl}/jobs/Location/${page.country_slug}/${page.state_slug}` },
    { name: page.town, url: `${siteUrl}/jobs/Location/${page.full_path}` },
  ];

  const relatedTowns: Array<{ name: string; country: string; state_slug: string }> = page.related_towns || [];
  const topRoles: Array<{ role: string; avg_salary: string; demand: string }> = page.top_roles || [];
  const majorEmployers: Array<{ name: string; sector: string }> = page.major_employers || [];
  const faqs: Array<{ question: string; answer: string }> = page.faqs || [];
  const blogLinks: Array<{ title: string; slug: string }> = page.blog_links || [];
  const salaryRanges = page.salary_ranges || {};
  const costOfLiving = page.cost_of_living || {};
  const coworkingSpaces: string[] = page.coworking_spaces || [];

  return (
    <>
      <BreadcrumbListSchema items={breadcrumbItems} />

      {/* Job list first */}
      <JobList initialCountry={page.country} initialState={page.state} initialTown={page.town} />

      {/* ── TOWN CONTENT ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Intro */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{page.h1_title || `Jobs in ${page.town}, ${page.state}`}</h1>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} />
              {page.state}, {page.country}
            </span>
            {page.area_type && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {page.area_type}
              </span>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed">{page.intro}</p>

          {/* Landmarks */}
          {page.landmarks && page.landmarks.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Landmarks</p>
              <div className="flex flex-wrap gap-2">
                {page.landmarks.map((l: string) => (
                  <span key={l} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job Market + Salary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {page.job_market_summary && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                Job Market
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">{page.job_market_summary}</p>
              {page.top_sectors && page.top_sectors.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {page.top_sectors.map((s: string) => (
                    <span key={s} className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {Object.keys(salaryRanges).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-yellow-600" />
                Salary Ranges
              </h2>
              <div className="space-y-3">
                {Object.entries(salaryRanges).filter(([k]) => k !== 'note').map(([level, data]: [string, any]) => (
                  <div key={level} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {level === 'entry' ? 'Entry Level' : level === 'mid' ? 'Mid Level' : level === 'senior' ? 'Senior' : 'Executive'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{data.min} – {data.max}</span>
                  </div>
                ))}
                {salaryRanges.note && <p className="text-xs text-gray-400 mt-2">{salaryRanges.note}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Commute + Remote Work */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {page.commute_notes && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car size={20} className="text-gray-600" />
                Getting to Work
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">{page.commute_notes}</p>
            </div>
          )}

          {(page.remote_work_suitability || coworkingSpaces.length > 0) && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wifi size={20} className="text-blue-600" />
                Remote Work & Co-working
              </h2>
              {page.remote_work_suitability && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{page.remote_work_suitability}</p>
              )}
              {coworkingSpaces.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Co-working Spaces</p>
                  <div className="flex flex-wrap gap-2">
                    {coworkingSpaces.map((space) => (
                      <span key={space} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{space}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Roles */}
        {topRoles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-600" />
              Top Roles in {page.town}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topRoles.map((role, i) => (
                <div key={i} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="font-semibold text-gray-900 mb-1 text-sm">{role.role}</p>
                  {role.avg_salary && <p className="text-sm text-green-700 font-medium">{role.avg_salary}</p>}
                  {role.demand && (
                    <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${role.demand === 'High' ? 'bg-green-100 text-green-700' : role.demand === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                      {role.demand} demand
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Major Employers */}
        {majorEmployers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Building2 size={20} className="text-purple-600" />
              Major Employers in {page.town}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {majorEmployers.map((emp, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <Building2 size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.sector}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost of Living */}
        {Object.keys(costOfLiving).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Cost of Living in {page.town}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(costOfLiving).filter(([k]) => k !== 'note' && k !== 'overall').map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-semibold text-gray-900">{value as string}</p>
                </div>
              ))}
            </div>
            {costOfLiving.note && <p className="text-sm text-gray-500 mt-4 italic">{costOfLiving.note}</p>}
          </div>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <HelpCircle size={20} className="text-orange-500" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-5">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <p className="font-semibold text-gray-900 mb-2">{faq.question}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Towns */}
        {relatedTowns.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nearby Areas in {page.state}</h2>
            <div className="flex flex-wrap gap-3">
              {relatedTowns.map((t) => {
                const key = `${page.country_slug}/${t.state_slug}/${t.slug}`;
                const isActive = activeTownSlugs.has(key);
                return isActive ? (
                  <Link
                    key={t.slug}
                    href={`/jobs/Location/${key}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700 hover:text-blue-700"
                  >
                    <MapPin size={14} />
                    {t.name}
                  </Link>
                ) : (
                  <span
                    key={t.slug}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-default"
                  >
                    <MapPin size={14} />
                    {t.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Blog Links */}
        {blogLinks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              Related Articles
            </h2>
            <div className="space-y-3">
              {blogLinks.map((post, i) => (
                <Link
                  key={i}
                  href={`/blog/${post.slug}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{post.title}</span>
                  <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SEO Content */}
        {page.seo_content && (
          <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: page.seo_content }}
          />
        )}
      </div>
    </>
  );
}