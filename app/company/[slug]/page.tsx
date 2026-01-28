import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Users, Briefcase, Globe, Linkedin, Twitter, Facebook, Instagram, CheckCircle, Mail, Phone, ExternalLink, Calendar, DollarSign, Clock } from 'lucide-react';
import { CompanySchema, FAQSchema } from '@/components/seo/StructuredData';
import { getCompanyName } from '@/lib/utils/companyUtils';

interface Company {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  logo_url: string | null;
  cover_image_url: string | null;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[] | null;
  h1_title: string;
  industry: string | null;
  company_size: string | null;
  founded_year: number | null;
  headquarters_location: string | null;
  website_url: string | null;
  careers_page_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  benefits: string[] | null;
  company_values: string[] | null;
  work_environment: string | null;
  faqs: any;
  is_verified: boolean;
  view_count: number;
  job_count: number;
}

async function getCompany(slug: string): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching company:', error);
    return null;
  }
}

async function incrementViewCount(slug: string) {
  try {
    await supabase.rpc('increment_company_views', { company_slug: slug });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

async function getCompanyJobs(companyName: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('posted_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching company jobs:', error);
      return [];
    }

    // Filter jobs by company name matching
    return data.filter(job => {
      const jobCompanyName = getCompanyName(job.company);
      return jobCompanyName.toLowerCase() === companyName.toLowerCase();
    });
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const company = await getCompany(params.slug);

  if (!company) {
    return {
      title: 'Company Not Found | JobMeter',
    };
  }

  const keywords = company.seo_keywords?.join(', ') || 'careers, jobs, company';
  const url = `https://jobmeter.app/company/${company.slug}`;

  return {
    title: company.meta_title,
    description: company.meta_description,
    keywords: keywords.split(',').map(k => k.trim()),
    authors: [{ name: 'JobMeter' }],
    openGraph: {
      title: company.meta_title,
      description: company.meta_description,
      url,
      siteName: 'JobMeter',
      locale: 'en_US',
      type: 'website',
      images: company.logo_url ? [{ url: company.logo_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: company.meta_title,
      description: company.meta_description,
      images: company.logo_url ? [company.logo_url] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('companies')
      .select('slug')
      .eq('is_published', true);

    if (!data) return [];

    return data.map((company) => ({
      slug: company.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function CompanyProfilePage({ params }: { params: { slug: string } }) {
  const company = await getCompany(params.slug);

  if (!company) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViewCount(params.slug);

  // Get company jobs
  const companyJobs = await getCompanyJobs(company.name);

  // Prepare social media links
  const socialLinks = [
    company.linkedin_url,
    company.twitter_url,
    company.facebook_url,
    company.instagram_url,
  ].filter(Boolean) as string[];

  return (
    <>
      {/* Structured Data */}
      <CompanySchema
        name={company.name}
        description={company.meta_description}
        url={company.website_url || undefined}
        logo={company.logo_url || undefined}
        address={company.headquarters_location || undefined}
        sameAs={socialLinks.length > 0 ? socialLinks : undefined}
      />

      {company.faqs && Array.isArray(company.faqs) && company.faqs.length > 0 && (
        <FAQSchema faqs={company.faqs} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link href="/company" className="hover:text-blue-600">Companies</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {company.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Cover Image */}
        {company.cover_image_url && (
          <div className="relative w-full h-64 bg-gray-200">
            <Image
              src={company.cover_image_url}
              alt={`${company.name} cover`}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/company"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Companies
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Company Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-start gap-6 mb-6">
                  {company.logo_url ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={company.logo_url}
                        alt={company.name}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Briefcase size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {company.h1_title}
                      </h1>
                      {company.is_verified && (
                        <CheckCircle size={24} className="text-blue-600" />
                      )}
                    </div>
                    {company.tagline && (
                      <p className="text-lg text-gray-600 mb-4">{company.tagline}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {company.industry && (
                        <div className="flex items-center gap-1">
                          <Briefcase size={16} />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      {company.headquarters_location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{company.headquarters_location}</span>
                        </div>
                      )}
                      {company.company_size && (
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{company.company_size} employees</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About {company.name}</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {company.description}
                  </p>
                </div>
              </div>

              {/* Company Values */}
              {company.company_values && company.company_values.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.company_values.map((value, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-1" />
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {company.benefits && company.benefits.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 bg-blue-50 rounded-lg p-4">
                        <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {company.faqs && Array.isArray(company.faqs) && company.faqs.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-6">
                    {company.faqs.map((faq: any, index: number) => (
                      <div key={index} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Quick Info & CTA */}
            <div className="lg:col-span-1 space-y-6">
              {/* Apply CTA */}
              <div className="bg-blue-600 rounded-lg shadow-sm p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Join Our Team</h3>
                <p className="text-blue-100 mb-4">
                  {companyJobs.length} open {companyJobs.length === 1 ? 'position' : 'positions'}
                </p>
                <Link
                  href={company.careers_page_url || `/jobs?company=${company.slug}`}
                  className="block w-full bg-white text-blue-600 text-center font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Open Positions
                </Link>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Company Info</h3>
                <div className="space-y-3 text-sm">
                  {company.founded_year && (
                    <div>
                      <span className="text-gray-600">Founded:</span>
                      <span className="ml-2 font-medium text-gray-900">{company.founded_year}</span>
                    </div>
                  )}
                  {company.work_environment && (
                    <div>
                      <span className="text-gray-600">Work Style:</span>
                      <span className="ml-2 font-medium text-gray-900">{company.work_environment}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Profile Views:</span>
                    <span className="ml-2 font-medium text-gray-900">{company.view_count}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Links */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact & Links</h3>
                <div className="space-y-3">
                  {company.website_url && (
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Globe size={18} />
                      <span className="text-sm">Website</span>
                      <ExternalLink size={14} className="ml-auto" />
                    </a>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Mail size={18} />
                      <span className="text-sm">{company.email}</span>
                    </a>
                  )}
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Phone size={18} />
                      <span className="text-sm">{company.phone}</span>
                    </a>
                  )}
                </div>

                {/* Social Media */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Follow Us</h4>
                  <div className="flex gap-3">
                    {company.linkedin_url && (
                      <a
                        href={company.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Linkedin size={20} />
                      </a>
                    )}
                    {company.twitter_url && (
                      <a
                        href={company.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Twitter size={20} />
                      </a>
                    )}
                    {company.facebook_url && (
                      <a
                        href={company.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Facebook size={20} />
                      </a>
                    )}
                    {company.instagram_url && (
                      <a
                        href={company.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Jobs */}
              {companyJobs.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
                  <div className="space-y-4">
                    {companyJobs.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Link 
                              href={`/jobs/${job.slug}`}
                              className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {job.title}
                            </Link>
                            
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                              {(() => {
                                const location = typeof job.location === 'string' 
                                  ? job.location 
                                  : (job.location?.remote 
                                      ? 'Remote'
                                      : [job.location?.city, job.location?.state, job.location?.country].filter(Boolean).join(', ') || 'Not specified');
                                return location && location !== 'Not specified' && (
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    <span>{location}</span>
                                  </div>
                                );
                              })()}
                              
                              {job.employment_type && (
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>{job.employment_type}</span>
                                </div>
                              )}
                              
                              {(() => {
                                if (job.salary_range && typeof job.salary_range === 'object' && job.salary_range.min) {
                                  const { min, currency, period } = job.salary_range;
                                  return (
                                    <div className="flex items-center gap-1">
                                      <DollarSign size={14} />
                                      <span>{currency} {min.toLocaleString()} {period || ''}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              
                              {job.posted_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            
                            {job.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {typeof job.description === 'string' 
                                  ? job.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                                  : 'Great opportunity at ' + company.name
                                }
                              </p>
                            )}
                          </div>
                          
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Job
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {companyJobs.length >= 10 && (
                    <div className="mt-6 text-center">
                      <Link
                        href={`/jobs?company=${company.name}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all positions
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}