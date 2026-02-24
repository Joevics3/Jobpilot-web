import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Newspaper, Calendar, Eye, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { BlogSchema } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Career Blog & Articles | Job Search Tips & Salary Guides | JobMeter',
  description: 'Read expert career advice, salary guides, interview tips, and job search strategies. Stay updated with the latest insights for Nigerian job seekers.',
  keywords: ['career blog', 'job search tips', 'salary guides', 'interview tips', 'career advice nigeria', 'professional development'],
  openGraph: {
    title: 'Career Blog & Articles | JobMeter',
    description: 'Expert career advice, salary guides, and job search tips for Nigerian professionals.',
    type: 'website',
    url: 'https://jobmeter.app/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Blog & Articles | JobMeter',
    description: 'Expert career advice, salary guides, and job search tips for Nigerian professionals.',
  },
  alternates: {
    canonical: 'https://jobmeter.app/blog',
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string;
  view_count: number;
  read_time_minutes: number | null;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, featured_image_url, category, tags, published_at, view_count, read_time_minutes')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export const revalidate = 86400; // 24 hours - blog changes daily

export default async function BlogPage() {
  const posts = await getBlogPosts();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Structured Data */}
      <BlogSchema />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold">Career Blog</h1>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Blog</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Newspaper size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No blog posts available</h2>
              <p className="text-gray-600">Check back soon for career insights and tips.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* All Posts Grid */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                      <article
                        key={post.id}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 flex flex-col"
                      >
                        {post.featured_image_url && (
                          <Link href={`/blog/${post.slug}`}>
                            <div className="relative w-full h-48 bg-gray-200">
                              <Image
                                src={post.featured_image_url}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>
                        )}

                        <div className="p-6 flex-1 flex flex-col">
                          <Link href={`/blog/${post.slug}`}>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </Link>

                          {post.excerpt && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{formatDate(post.published_at)}</span>
                              </div>
                              {post.view_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <Eye size={14} />
                                  <span>{post.view_count}</span>
                                </div>
                              )}
                            </div>
                            <Link
                              href={`/blog/${post.slug}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              Read
                              <ArrowRight size={16} />
                            </Link>
                          </div>
                        </div>
                      </article>
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