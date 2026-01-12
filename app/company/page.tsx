import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, Briefcase, Users, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Top Companies Hiring in Nigeria | Company Directory | JobMeter',
  description: 'Explore top companies hiring in Nigeria. Discover company culture, benefits, open positions, and career opportunities from leading employers.',
  keywords: ['companies hiring nigeria', 'top employers', 'company directory', 'career opportunities', 'company profiles'],
  openGraph: {
    title: 'Top Companies Hiring in Nigeria | JobMeter',
    description: 'Explore top companies hiring in Nigeria. Discover company culture, benefits, and career opportunities.',
    type: 'website',
    url: 'https://jobmeter.app/company',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Companies Hiring in Nigeria | JobMeter',
    description: 'Explore top companies hiring in Nigeria. Discover company culture, benefits, and career opportunities.',
  },
  alternates: {
    canonical: 'https://jobmeter.app/company',
  },
};

interface Company {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo_url: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters_location: string | null;
  is_verified: boolean;
  view_count: number;
  job_count: number;
}

async function getCompanies(): Promise<Company[]> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, slug, tagline, logo_url, industry, company_size, headquarters_location, is_verified, view_count, job_count')
      .eq('is_published', true)
      .order('is_verified', { ascending: false })
      .order('job_count', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

// Group companies by industry
function groupByIndustry(companies: Company[]) {
  const grouped = companies.reduce((acc, company) => {
    const industry = company.industry || 'Other';
    if (!acc[industry]) {
      acc[industry] = [];
    }
    acc[industry].push(company);
    return acc;
  }, {} as Record<string, Company[]>);

  return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
}

export const revalidate = 1800; // Revalidate every 30 minutes

export default async function CompanyDirectoryPage() {
  const companies = await getCompanies();
  const groupedCompanies = groupByIndustry(companies);
  const verifiedCompanies = companies.filter(c => c.is_verified);

  // JSON-LD for Organization List
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Companies Hiring in Nigeria',
    description: 'Directory of top companies hiring in Nigeria',
    numberOfItems: companies.length,
    itemListElement: companies.slice(0, 10).map((company, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Organization',
        name: company.name,
        url: `https://jobmeter.app/company/${company.slug}`,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <Building2 size={32} />
              <h1 className="text-4xl font-bold">Company Directory</h1>
            </div>
            <p className="text-lg text-white max-w-3xl">
              Discover top companies hiring in Nigeria. Explore company culture, benefits, and find your next career opportunity.
            </p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <span className="flex items-center gap-2">
                <Building2 size={16} />
                {companies.length} companies
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle size={16} />
                {verifiedCompanies.length} verified
              </span>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Companies</span>
            </nav>
          </div>
        </div>

        {/* Call to Action - Register Company */}
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Are you an employer?
                </h2>
                <p className="text-gray-600">
                  Register your company to attract top talent and showcase your culture.
                </p>
              </div>
              <Link
                href="/company/register"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              >
                Register Company
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {companies.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No companies available</h2>
              <p className="text-gray-600">Check back soon for company profiles.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Verified Companies Section */}
              {verifiedCompanies.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle size={24} className="text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Verified Companies</h2>
                    <span className="text-sm text-gray-500">({verifiedCompanies.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {verifiedCompanies.map((company) => (
                      <Link
                        key={company.id}
                        href={`/company/${company.slug}`}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          {company.logo_url ? (
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={company.logo_url}
                                alt={company.name}
                                fill
                                className="object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 size={32} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900 truncate">
                                {company.name}
                              </h3>
                              {company.is_verified && (
                                <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            {company.tagline && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {company.tagline}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          {company.industry && (
                            <div className="flex items-center gap-2">
                              <Briefcase size={14} className="flex-shrink-0" />
                              <span className="truncate">{company.industry}</span>
                            </div>
                          )}
                          {company.headquarters_location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="flex-shrink-0" />
                              <span className="truncate">{company.headquarters_location}</span>
                            </div>
                          )}
                          {company.company_size && (
                            <div className="flex items-center gap-2">
                              <Users size={14} className="flex-shrink-0" />
                              <span>{company.company_size} employees</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-600">
                            {company.job_count} {company.job_count === 1 ? 'job' : 'jobs'}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                            View Profile
                            <ArrowRight size={16} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* All Companies by Industry */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Companies</h2>
                <div className="space-y-8">
                  {groupedCompanies.map(([industry, industryCompanies]) => (
                    <div key={industry}>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {industry}
                        <span className="text-sm font-normal text-gray-500">
                          ({industryCompanies.length})
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {industryCompanies.map((company) => (
                          <Link
                            key={company.id}
                            href={`/company/${company.slug}`}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              {company.logo_url ? (
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  <Image
                                    src={company.logo_url}
                                    alt={company.name}
                                    fill
                                    className="object-contain rounded-lg"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Building2 size={32} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-lg font-bold text-gray-900 truncate">
                                    {company.name}
                                  </h4>
                                  {company.is_verified && (
                                    <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                                {company.tagline && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {company.tagline}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <span className="text-sm text-gray-600">
                                {company.job_count} {company.job_count === 1 ? 'job' : 'jobs'}
                              </span>
                              <span className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                                View
                                <ArrowRight size={16} />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}