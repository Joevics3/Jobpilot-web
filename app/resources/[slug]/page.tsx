import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BlogPostContent from '@/components/resources/BlogPostContent';
import ShareButton from '@/components/resources/ShareButton';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye } from 'lucide-react';
import BannerAd from '@/components/ads/BannerAd';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
  updated_at?: string;
  view_count: number;
  seo_keywords: string[] | null;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, featured_image_url, category, tags, meta_title, meta_description, published_at, updated_at, view_count, seo_keywords')
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
    await supabase.rpc('increment_blog_post_views', { post_slug: slug });
  } catch (error) {
    // Silent fail - view count increment is not critical
    console.error('Error incrementing view count:', error);
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | JobMeter Resources',
    };
  }

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || 'Career advice and job search tips';
  const keywords = post.seo_keywords?.join(', ') || post.tags?.join(', ') || 'career advice, job search';
  const url = `https://jobmeter.app/resources/${post.slug}`;
  const image = post.featured_image_url || 'https://jobmeter.app/og-image.png';

  return {
    title: `${title} | JobMeter Resources`,
    description,
    keywords: keywords.split(',').map(k => k.trim()),
    authors: [{ name: 'JobMeter' }],
    openGraph: {
      title,
      description,
      url,
      siteName: 'JobMeter',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.published_at,
      section: post.category || 'Career Advice',
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
    other: {
      'article:published_time': post.published_at,
      'article:section': post.category || 'Career Advice',
      ...(post.tags && { 'article:tag': post.tags.join(',') }),
    },
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('blog_posts')
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

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt || '',
    image: post.featured_image_url || '',
      datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      '@type': 'Organization',
      name: 'JobMeter',
    },
    publisher: {
      '@type': 'Organization',
      name: 'JobMeter',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://jobmeter.app/resources/${post.slug}`,
    },
    ...(post.category && { articleSection: post.category }),
    ...(post.tags && { keywords: post.tags.join(', ') }),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-purple-600">Home</Link>
              <span>/</span>
              <Link href="/resources" className="hover:text-purple-600">Resources</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium line-clamp-1">{post.title}</span>
            </nav>
          </div>
        </div>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Resources
          </Link>

          {/* Header */}
          <header className="mb-8">
            {post.category && (
              <span className="inline-block text-sm font-semibold text-purple-600 mb-4">
                {post.category}
              </span>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <time dateTime={post.published_at}>
                  {formatDate(post.published_at)}
                </time>
              </div>
              {post.view_count > 0 && (
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span>{post.view_count} views</span>
                </div>
              )}
              <ShareButton
                title={post.title}
                text={post.excerpt || ''}
                url={`https://jobmeter.app/resources/${post.slug}`}
              />
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="relative w-full h-64 md:h-96 bg-gray-200 rounded-lg mb-8 overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Banner Ad - Below Featured Image */}
          <div className="mb-8">
            <BannerAd />
          </div>

          {/* Content */}
          <BlogPostContent content={post.content} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  );
}

