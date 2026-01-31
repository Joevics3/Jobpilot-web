import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Eye, Clock, Tag, Share2 } from 'lucide-react';
import { ArticleSchema, FAQSchema } from '@/components/seo/StructuredData';

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
  author_name: string;
  author_image_url: string | null;
  faqs: any;
  related_posts: string[] | null;
  view_count: number;
  read_time_minutes: number | null;
  published_at: string;
  updated_at: string;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
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
    authors: [{ name: post.author_name }],
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
          name: post.author_name,
        }}
        url={`https://jobmeter.app/blog/${post.slug}`}
      />
      
      {post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0 && (
        <FAQSchema faqs={post.faqs} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-blue-600">Blog</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {post.title}
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </Link>

          {/* Article Header */}
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="relative w-full h-96">
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div className="p-8 lg:p-12">
              {/* Category */}
              {post.category && (
                <span className="inline-block text-sm font-semibold text-blue-600 mb-4">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {post.h1_title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {post.author_image_url && (
                    <Image
                      src={post.author_image_url}
                      alt={post.author_name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900">{post.author_name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(post.published_at)}</span>
                </div>
                {post.read_time_minutes && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{post.read_time_minutes} min read</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Eye size={16} />
                  <span>{post.view_count} views</span>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <Tag size={16} className="text-gray-500" />
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Article Content */}
              <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-ul:my-6 prose-ol:my-6 prose-li:my-2"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") }}
              />

              {/* FAQs Section */}
              {post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-6">
                    {post.faqs.map((faq: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
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

              {/* Share Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Share this article</span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Related Posts */}
          {post.related_posts && post.related_posts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* You can fetch and display related posts here */}
                <p className="text-gray-600">Related posts coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}