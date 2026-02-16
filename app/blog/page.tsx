import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Newspaper, TrendingUp, Calendar, Eye, ArrowRight } from 'lucide-react';
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

// Get unique categories
function getCategories(posts: BlogPost[]): string[] {
  const categories = posts
    .map(p => p.category)
    .filter((c): c is string => c !== null);
  return Array.from(new Set(categories));
}

export const revalidate = 1800; // Revalidate every 30 minutes

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const categories = getCategories(posts);
  
  const featuredPost = posts[0];
  const recentPosts = posts.slice(1);

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper size={32} />
              <h1 className="text-4xl font-bold">Career Blog & Articles</h1>
            </div>
            <p className="text-lg text-white max-w-3xl">
              Expert insights, salary guides, and career tips to help you succeed in your job search and professional growth.
            </p>
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
              {/* Featured Post */}
              {featuredPost && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={24} className="text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Featured Article</h2>
                  </div>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
                      <div className="grid md:grid-cols-2 gap-0">
                        {featuredPost.featured_image_url && (
                          <div className="relative h-64 md:h-auto">
                            <Image
                              src={featuredPost.featured_image_url}
                              alt={featuredPost.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-8">
                          {featuredPost.category && (
                            <span className="inline-block text-xs font-semibold text-blue-600 mb-2">
                              {featuredPost.category}
                            </span>
                          )}
                          <h3 className="text-3xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                            {featuredPost.title}
                          </h3>
                          {featuredPost.excerpt && (
                            <p className="text-gray-600 mb-4 text-lg">
                              {featuredPost.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{formatDate(featuredPost.published_at)}</span>
                            </div>
                            {featuredPost.read_time_minutes && (
                              <span>{featuredPost.read_time_minutes} min read</span>
                            )}
                            {featuredPost.view_count > 0 && (
                              <div className="flex items-center gap-1">
                                <Eye size={16} />
                                <span>{featuredPost.view_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </section>
              )}

              {/* Categories Filter (Optional - can be added later) */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-sm font-medium text-gray-700">Categories:</span>
                  {categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Recent Posts Grid */}
              {recentPosts.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentPosts.map((post) => (
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
                          {post.category && (
                            <span className="inline-block text-xs font-semibold text-blue-600 mb-2">
                              {post.category}
                            </span>
                          )}

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

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
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
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}