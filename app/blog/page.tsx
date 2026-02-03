import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Newspaper, Calendar, ArrowRight, User } from 'lucide-react';
import Image from 'next/image';
import { BlogSchema } from '@/components/seo/StructuredData';
import CategoryFilter from './CategoryFilter';

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

interface Author {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
}

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
  author_id: string | null;
  authors: Author | null;
}

// Helper function to normalize authors from Supabase array to single object
function normalizePost(post: any): BlogPost {
  return {
    ...post,
    authors: post.authors && Array.isArray(post.authors) && post.authors.length > 0 
      ? post.authors[0] 
      : null
  };
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        id, title, slug, excerpt, featured_image_url, category, tags, published_at, view_count, read_time_minutes, author_id,
        authors:author_id (
          id,
          slug,
          name,
          image_url
        )
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return ((data || []) as any[]).map(normalizePost);
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
  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Structured Data */}
      <BlogSchema />

      <div className="min-h-screen bg-gray-50">
        {/* Header - Mobile Optimized */}
        <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Newspaper size={24} className="sm:size-7 lg:size-8" />
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">Career Blog & Articles</h1>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-3xl leading-relaxed">
              Expert insights, salary guides, and career tips to help you succeed in your job search and professional growth.
            </p>
          </div>
        </div>

        {/* Breadcrumb - Mobile Optimized */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-4">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Blog</span>
            </nav>
          </div>
        </div>

        {/* Main Content - Mobile Optimized */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-12 text-center">
              <Newspaper size={36} className="sm:size-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">No blog posts available</h2>
              <p className="text-sm text-gray-600">Check back soon for career insights and tips.</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Categories Filter - Mobile Optimized */}
              <CategoryFilter categories={categories} />

              {/* Posts Grid - Mobile Optimized */}
              {posts.length > 0 && (
                <section>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group block"
                      >
                        <article className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg sm:hover:shadow-xl hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 flex flex-col h-full">
                          {post.featured_image_url && (
                            <div className="relative w-full h-40 sm:h-44 lg:h-48 bg-gray-200 overflow-hidden">
                              <Image
                                src={post.featured_image_url}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}

                          <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                            {post.category && (
                              <span className="inline-block text-[10px] sm:text-xs font-semibold text-blue-600 mb-1.5 sm:mb-2">
                                {post.category}
                              </span>
                            )}

                            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight sm:leading-snug">
                              {post.title}
                            </h3>

                            {post.excerpt && (
                              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 flex-1 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-gray-100">
                              <div className="flex flex-col gap-1.5">
                                {/* Author Link */}
                                {post.authors && (
                                  <Link
                                    href={`/blog/author/${post.authors.slug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-600 hover:text-blue-600 transition-colors group/author"
                                  >
                                    {post.authors.image_url ? (
                                      <Image
                                        src={post.authors.image_url}
                                        alt={post.authors.name}
                                        width={16}
                                        height={16}
                                        className="rounded-full w-4 h-4 sm:w-5 sm:h-5"
                                      />
                                    ) : (
                                      <User size={14} className="sm:size-4" />
                                    )}
                                    <span className="font-medium group-hover/author:text-blue-600">{post.authors.name}</span>
                                  </Link>
                                )}
                                {/* Date and Read Time */}
                                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} className="sm:size-3.5" />
                                    <span>{formatDate(post.published_at)}</span>
                                  </div>
                                  {post.read_time_minutes && (
                                    <span className="hidden sm:inline">{post.read_time_minutes} min read</span>
                                  )}
                                </div>
                              </div>
                              <span className="flex items-center gap-0.5 sm:gap-1 text-blue-600 group-hover:text-blue-700 font-medium text-xs sm:text-sm">
                                <span className="hidden sm:inline">Read</span>
                                <ArrowRight size={14} className="sm:size-4 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
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
