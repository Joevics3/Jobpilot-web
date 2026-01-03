import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import BlogPostsList from '@/components/resources/BlogPostsList';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import ResourcesBannerAd from '@/components/resources/ResourcesBannerAd';

export const metadata: Metadata = {
  title: 'Career Resources & Blog | JobMeter',
  description: 'Discover career advice, job search tips, interview strategies, and professional development resources to advance your career.',
  keywords: ['career advice', 'job search tips', 'interview preparation', 'career development', 'professional growth'],
  openGraph: {
    title: 'Career Resources & Blog | JobMeter',
    description: 'Discover career advice, job search tips, interview strategies, and professional development resources.',
    type: 'website',
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
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image_url, category, tags, published_at, view_count')
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

export default async function ResourcesPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={32} />
            <h1 className="text-4xl font-bold">Career Resources</h1>
          </div>
          <p className="text-lg text-white max-w-3xl">
            Discover expert career advice, job search strategies, interview tips, and professional development resources to help you succeed.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Resources</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No posts available</h2>
            <p className="text-gray-600">Check back soon for career resources and blog posts.</p>
          </div>
        ) : (
          <>
            {/* Banner Ad - At Top */}
            <ResourcesBannerAd />

            {/* All Posts Together */}
            <BlogPostsList posts={posts} />
          </>
        )}
      </div>
    </div>
  );
}








