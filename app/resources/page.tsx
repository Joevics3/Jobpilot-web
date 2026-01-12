import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Briefcase, MapPin, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browse Jobs by Category | JobMeter',
  description: 'Explore job opportunities across different categories and locations in Nigeria. Find accountant jobs, tech jobs, healthcare jobs, and more.',
  keywords: ['job categories', 'job search', 'careers', 'employment', 'Nigeria jobs'],
  openGraph: {
    title: 'Browse Jobs by Category | JobMeter',
    description: 'Explore job opportunities across different categories and locations in Nigeria.',
    type: 'website',
  },
};

interface CategoryPage {
  id: string;
  category: string;
  location: string | null;
  slug: string;
  h1_title: string;
  meta_description: string;
  job_count: number;
  view_count: number;
}

async function getCategoryPages(): Promise<CategoryPage[]> {
  try {
    const { data, error } = await supabase
      .from('category_pages')
      .select('id, category, location, slug, h1_title, meta_description, job_count, view_count')
      .eq('is_published', true)
      .order('job_count', { ascending: false });

    if (error) {
      console.error('Error fetching category pages:', error);
      return [];
    }

    console.log('Fetched category pages:', data?.length); // Debug log
    return data || [];
  } catch (error) {
    console.error('Error fetching category pages:', error);
    return [];
  }
}

// Group categories by type (national vs location-specific)
function groupCategories(pages: CategoryPage[]) {
  const national = pages.filter(p => !p.location);
  const byLocation = pages.filter(p => p.location);
  
  console.log('National pages:', national.length); // Debug log
  console.log('Location pages:', byLocation.length); // Debug log
  
  return { national, byLocation };
}

export const revalidate = 3600; // Revalidate every hour

export default async function ResourcesPage() {
  const pages = await getCategoryPages();
  const { national, byLocation } = groupCategories(pages);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase size={32} />
            <h1 className="text-4xl font-bold">Browse Jobs by Category</h1>
          </div>
          <p className="text-lg text-white max-w-3xl">
            Explore thousands of job opportunities across Nigeria. Find your perfect role by category and location.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No categories available</h2>
            <p className="text-gray-600">Check back soon for job categories.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* National Categories */}
            {national.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Popular Job Categories</h2>
                  <span className="text-sm text-gray-500">({national.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {national.map((page) => (
                    <Link
                      key={page.id}
                      href={`/resources/${page.slug}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {page.h1_title.replace(' | JobMeter', '')}
                        </h3>
                        <Briefcase size={20} className="text-blue-600 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {page.meta_description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {page.job_count} jobs
                        </span>
                        <span>{page.view_count} views</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Location-Specific Categories */}
            {byLocation.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <MapPin size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Jobs by Location</h2>
                  <span className="text-sm text-gray-500">({byLocation.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {byLocation.map((page) => (
                    <Link
                      key={page.id}
                      href={`/resources/${page.slug}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {page.h1_title.replace(' | JobMeter', '')}
                        </h3>
                        <MapPin size={20} className="text-blue-600 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {page.meta_description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {page.job_count} jobs
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {page.location}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Debug:</strong> Total pages: {pages.length} | National: {national.length} | Location: {byLocation.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}