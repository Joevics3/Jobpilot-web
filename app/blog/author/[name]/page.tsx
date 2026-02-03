import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, FileText } from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  published_at: string;
  read_time_minutes: number | null;
}

interface Author {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

interface AuthorData {
  author: Author;
  posts: BlogPost[];
}

async function getAuthorData(authorSlug: string): Promise<AuthorData | null> {
  try {
    // First, get the author from authors table
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('*')
      .eq('slug', authorSlug)
      .single();

    if (authorError || !author) {
      console.error('Error fetching author:', authorError);
      return null;
    }

    // Then fetch all posts by this author using author_id
    const { data: posts, error: postsError } = await supabase
      .from('blogs')
      .select('slug, title, excerpt, featured_image_url, category, published_at, read_time_minutes')
      .eq('is_published', true)
      .eq('author_id', author.id)
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching author posts:', postsError);
      return null;
    }

    return {
      author,
      posts: posts || [],
    };
  } catch (error) {
    console.error('Error fetching author data:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const data = await getAuthorData(params.name);

  if (!data) {
    return {
      title: 'Author Not Found | JobMeter',
    };
  }

  return {
    title: `${data.author.name} - Author | JobMeter Blog`,
    description: data.author.bio || `Read articles by ${data.author.name} on JobMeter Career Blog`,
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('authors')
      .select('slug');

    if (!data) return [];

    return data.map((author) => ({
      name: author.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function AuthorPage({ params }: { params: { name: string } }) {
  const data = await getAuthorData(params.name);

  if (!data) {
    notFound();
  }

  const { author, posts } = data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-4">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{author.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 font-medium text-sm sm:text-base"
        >
          <ArrowLeft size={18} className="sm:size-5" />
          <span>Back to Blog</span>
        </Link>

        {/* Author Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {author.image_url ? (
              <Image
                src={author.image_url}
                alt={author.name}
                width={120}
                height={120}
                className="rounded-full w-24 h-24 sm:w-32 sm:h-32 object-cover"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-gray-400">
                  {author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {author.name}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Author at JobMeter Career Blog
              </p>
              {author.bio && (
                <p className="text-gray-700 text-sm sm:text-base mb-4 leading-relaxed">
                  {author.bio}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText size={16} />
                  <span>{posts.length} article{posts.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              {/* Social Links */}
              {(author.twitter_url || author.linkedin_url || author.website_url) && (
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  {author.twitter_url && (
                    <a 
                      href={author.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      Twitter
                    </a>
                  )}
                  {author.linkedin_url && (
                    <a 
                      href={author.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                  {author.website_url && (
                    <a 
                      href={author.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Author's Posts */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Articles by {author.name}
          </h2>
          
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <p className="text-gray-600">No articles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {post.featured_image_url && (
                    <div className="relative w-full h-40 sm:h-48">
                      <Image
                        src={post.featured_image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    {post.category && (
                      <span className="inline-block text-xs font-semibold text-blue-600 mb-2">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      {post.read_time_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{post.read_time_minutes} min read</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
