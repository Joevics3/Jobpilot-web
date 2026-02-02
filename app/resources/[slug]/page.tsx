import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CategoryJobList from '@/components/category/CategoryJobList';
import CategoryContent from '@/components/category/CategoryContent';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin } from 'lucide-react';

interface CategoryPage {
  id: string;
  category: string;
  location: string | null;
  slug: string;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[] | null;
  h1_title: string;
  about_role: string | null;
  who_should_apply: string | null;
  how_to_stand_out: string | null;
  key_responsibilities: string[] | null;
  faqs: any;
  related_categories: string[] | null;
  related_locations: string[] | null;
  view_count: number;
  job_count: number;
  town: string | null;
}

interface RelatedCategory {
  slug: string;
  h1_title: string;
  job_count: number;
  location: string | null;
  town: string | null;
}

async function getCategoryPage(slug: string): Promise<CategoryPage | null> {
  try {
    const { data, error } = await supabase
      .from('category_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching category page:', error);
    return null;
  }
}

async function incrementViewCount(slug: string) {
  try {
    await supabase.rpc('increment_category_page_views', { page_slug: slug });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

async function fetchRelatedCategories(page: CategoryPage): Promise<RelatedCategory[]> {
  try {
    const relatedSlugs: string[] = [];
    
    // Priority 1: Same town
    if (page.town) {
      const { data: townCategories } = await supabase
        .from('category_pages')
        .select('slug, h1_title, job_count, location, town')
        .eq('town', page.town)
        .eq('is_published', true)
        .neq('slug', page.slug)
        .limit(3);
      
      if (townCategories) {
        townCategories.forEach(cat => relatedSlugs.push(cat.slug));
      }
    }
    
    // Priority 2: Same location (state)
    if (page.location && relatedSlugs.length < 6) {
      const { data: locationCategories } = await supabase
        .from('category_pages')
        .select('slug, h1_title, job_count, location, town')
        .eq('location', page.location)
        .eq('is_published', true)
        .neq('slug', page.slug)
        .not('slug', 'in', `(${relatedSlugs.join(',')})`)
        .limit(6 - relatedSlugs.length);
      
      if (locationCategories) {
        locationCategories.forEach(cat => relatedSlugs.push(cat.slug));
      }
    }
    
    // Priority 3: Related categories from array
    if (page.related_categories && page.related_categories.length > 0 && relatedSlugs.length < 6) {
      const remainingSlots = 6 - relatedSlugs.length;
      const categoriesToFetch = page.related_categories
        .filter(slug => !relatedSlugs.includes(slug))
        .slice(0, remainingSlots);
      
      if (categoriesToFetch.length > 0) {
        const { data: relatedCategories } = await supabase
          .from('category_pages')
          .select('slug, h1_title, job_count, location, town')
          .in('slug', categoriesToFetch)
          .eq('is_published', true)
          .limit(remainingSlots);
        
        if (relatedCategories) {
          relatedCategories.forEach(cat => relatedSlugs.push(cat.slug));
        }
      }
    }
    
    // Priority 4: Related locations from array
    if (page.related_locations && page.related_locations.length > 0 && relatedSlugs.length < 6) {
      const remainingSlots = 6 - relatedSlugs.length;
      const locationsToFetch = page.related_locations
        .filter(slug => !relatedSlugs.includes(slug))
        .slice(0, remainingSlots);
      
      if (locationsToFetch.length > 0) {
        const { data: locationCategories } = await supabase
          .from('category_pages')
          .select('slug, h1_title, job_count, location, town')
          .in('slug', locationsToFetch)
          .eq('is_published', true)
          .limit(remainingSlots);
        
        if (locationCategories) {
          locationCategories.forEach(cat => {
            if (!relatedSlugs.includes(cat.slug)) {
              relatedSlugs.push(cat.slug);
            }
          });
        }
      }
    }
    
    // Fetch full details for all collected slugs
    if (relatedSlugs.length === 0) return [];
    
    const { data: finalCategories } = await supabase
      .from('category_pages')
      .select('slug, h1_title, job_count, location, town')
      .in('slug', relatedSlugs)
      .eq('is_published', true)
      .limit(6);
    
    return finalCategories || [];
  } catch (error) {
    console.error('Error fetching related categories:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getCategoryPage(params.slug);

  if (!page) {
    return {
      title: 'Category Not Found | JobMeter',
    };
  }

  const keywords = page.seo_keywords?.join(', ') || 'jobs, careers, employment';
  const url = `https://jobmeter.app/resources/${page.slug}`;
  
  // Add "(Hiring near me)" to meta title for location-specific pages (states and towns)
  // Only add if total character count stays within reasonable SEO limits (~60-70 chars)
  const shouldAddNearMe = !!page.location && 
    (page.meta_title.length + " (Hiring near me)".length) <= 70;
  const title = shouldAddNearMe 
    ? `${page.meta_title} (Hiring near me)` 
    : page.meta_title;

  return {
    title: title,
    description: page.meta_description,
    keywords: keywords.split(',').map(k => k.trim()),
    authors: [{ name: 'JobMeter' }],
    openGraph: {
      title: title,
      description: page.meta_description,
      url,
      siteName: 'JobMeter',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: page.meta_description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('category_pages')
      .select('slug')
      .eq('is_published', true);

    if (!data) return [];

    return data.map((page) => ({
      slug: page.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const page = await getCategoryPage(params.slug);

  if (!page) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViewCount(params.slug);

  // Fetch related categories for interlinking
  const relatedCategories = await fetchRelatedCategories(page);

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.h1_title,
    description: page.meta_description,
    url: `https://jobmeter.app/resources/${page.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name: page.h1_title,
      description: page.meta_description,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://jobmeter.app',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Categories',
          item: 'https://jobmeter.app/resources',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: page.h1_title,
          item: `https://jobmeter.app/resources/${page.slug}`,
        },
      ],
    },
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
              {page.location ? <MapPin size={32} /> : <Briefcase size={32} />}
              <h1 className="text-4xl font-bold">{page.h1_title}</h1>
            </div>
            <p className="text-lg text-white max-w-3xl">
              {page.meta_description}
            </p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <span className="flex items-center gap-2">
                <Briefcase size={16} />
                {page.job_count} active jobs
              </span>
              {page.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={16} />
                  {page.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link href="/resources" className="hover:text-blue-600">Categories</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {page.h1_title.replace(' | JobMeter', '')}
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Categories
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Job Listings (2/3 width) */}
            <div className="lg:col-span-2">
              <CategoryJobList 
                category={page.category} 
                location={page.location}
              />
            </div>

            {/* Sidebar - Category Information (1/3 width) */}
            <div className="lg:col-span-1">
              <CategoryContent page={page} />
            </div>
          </div>

          {/* Related Categories Section - SEO Interlinking */}
          {relatedCategories.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Job Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedCategories.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/resources/${related.slug}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {related.h1_title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{related.job_count} jobs</span>
                      {related.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {related.town || related.location}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}