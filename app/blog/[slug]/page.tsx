import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Eye, Clock, Tag } from 'lucide-react';
import { ArticleSchema, FAQSchema } from '@/components/seo/StructuredData';
import BlogMarkdownRenderer from '@/components/BlogMarkdownRenderer';
import ShareButton from '@/components/blog/ShareButton';

interface Author {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  image_url: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[] | null;
  h1_title: string;
  category: string | null;
  tags: string[] | null;
  author_id: string | null;
  authors: Author | null;
  faqs: any;
  related_posts: string[] | null;
  view_count: number;
  read_time_minutes: number | null;
  published_at: string;
  updated_at: string;
}

interface RelatedBlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  published_at: string;
  read_time_minutes: number | null;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        *,
        authors:author_id (
          id,
          slug,
          name,
          bio,
          image_url
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

async function incrementViewCount(slug: string) {
  try {
    await supabase.rpc('increment_blog_views', { blog_slug: slug });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

async function fetchRelatedPosts(currentPost: BlogPost): Promise<RelatedBlogPost[]> {
  if (!currentPost.category) return [];
  
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('slug, title, excerpt, featured_image_url, category, published_at, read_time_minutes')
      .eq('category', currentPost.category)
      .eq('is_published', true)
      .neq('slug', currentPost.slug)
      .order('published_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | JobMeter',
    };
  }

  const keywords = post.seo_keywords?.join(', ') || 'career, jobs, blog';
  const url = `https://jobmeter.app/blog/${post.slug}`;

  return {
    title: post.meta_title,
    description: post.meta_description,
    keywords: keywords.split(',').map(k => k.trim()),
    authors: [{ name: post.authors?.name || 'JobMeter' }],
    openGraph: {
      title: post.meta_title,
      description: post.meta_description,
      url,
      siteName: 'JobMeter',
      locale: 'en_US',
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title,
      description: post.meta_description,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('blogs')
      .select('slug')
      .eq('is_published', true);

    if (!data) return [];

    return data.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  // Increment view count (non-blocking)
  incrementViewCount(params.slug);

  // Fetch related posts by category for SEO interlinking
  const relatedPosts = await fetchRelatedPosts(post);

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
      <ArticleSchema
        headline={post.h1_title}
        description={post.meta_description}
        image={post.featured_image_url || undefined}
        datePublished={post.published_at}
        dateModified={post.updated_at}
        author={{
          name: post.authors?.name || 'JobMeter',
        }}
        url={`https://jobmeter.app/blog/${post.slug}`}
      />
      
      {post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0 && (
        <FAQSchema faqs={post.faqs} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb - Mobile Optimized */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-4">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/blog" className="hover:text-blue-600">Blog</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {post.title}
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Back Button - Mobile Optimized */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 font-medium text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:size-5" />
            <span className="hidden sm:inline">Back to Blog</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Article Header */}
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Featured Image - Mobile Optimized */}
            {post.featured_image_url && (
              <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96">
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Content - Mobile Optimized */}
            <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
              {/* Category */}
              {post.category && (
                <span className="inline-block text-xs sm:text-sm font-semibold text-blue-600 mb-3 sm:mb-4">
                  {post.category}
                </span>
              )}

              {/* Title - Mobile Optimized */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {post.h1_title}
              </h1>

              {/* Meta Info - Mobile Optimized */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                {post.authors && (
                  <Link href={`/blog/author/${post.authors.slug}`} className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
                    {post.authors.image_url && (
                      <Image
                        src={post.authors.image_url}
                        alt={post.authors.name}
                        width={28}
                        height={28}
                        className="rounded-full sm:w-8 sm:h-8"
                      />
                    )}
                    <span className="text-xs sm:text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">{post.authors.name}</span>
                  </Link>
                )}
                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                  <Calendar size={14} className="sm:size-4" />
                  <span>{formatDate(post.published_at)}</span>
                </div>
                {post.read_time_minutes && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <Clock size={14} className="sm:size-4" />
                    <span>{post.read_time_minutes} min read</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                  <Eye size={14} className="sm:size-4" />
                  <span>{post.view_count} views</span>
                </div>
              </div>

              {/* Article Content */}
              <BlogMarkdownRenderer content={post.content} />

              {/* FAQs Section - Mobile Optimized */}
              {post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0 && (
                <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4 sm:space-y-6">
                    {post.faqs.map((faq: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                          {faq.question}
                        </h3>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Section - Mobile Optimized */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">Share this article</span>
                  <ShareButton 
                    title={post.title}
                    text={post.excerpt || post.meta_description}
                    url={`https://jobmeter.app/blog/${post.slug}`}
                  />
                </div>
              </div>

              {/* Tags - Mobile Optimized */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Tag size={14} className="text-gray-500 sm:size-4" />
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Related Posts by Category - Mobile Optimized */}
          {relatedPosts.length > 0 && (
            <section className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                More Articles in {post.category}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                Explore more career insights and job search tips
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    {related.featured_image_url && (
                      <div className="relative w-full h-36 sm:h-40 lg:h-48">
                        <Image
                          src={related.featured_image_url}
                          alt={related.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">
                          {related.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span>{formatDate(related.published_at)}</span>
                        {related.read_time_minutes && (
                          <span>{related.read_time_minutes} min read</span>
                        )}
                      </div>
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
