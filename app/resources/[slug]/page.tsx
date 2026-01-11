// app/resources/[slug]/page.tsx

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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getCategoryPage(params.slug);

  if (!page) {
    return {
      title: 'Category Not Found | JobMeter',
    };
  }

  const keywords = page.seo_keywords?.join(', ') || 'jobs, careers, employment';
  const url = `https://jobmeter.app/resources/${page.slug}`;

  return {
    title: page.meta_title,
    description: page.meta_description,
    keywords: keywords.split(',').map(k => k.trim()),
    authors: [{ name: 'JobMeter' }],
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      url,
      siteName: 'JobMeter',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta_title,
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
        </div>
      </div>
    </>
  );
}