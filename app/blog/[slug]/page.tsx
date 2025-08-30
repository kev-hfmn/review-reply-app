import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, ShareIcon, BookmarkIcon } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { BlogService } from '@/lib/services/blogService';
import { BlogPostCard } from '@/components/BlogPostCard';
import { TableOfContents } from '@/components/TableOfContents';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

async function getPostData(slug: string) {
  const post = await BlogService.getPostBySlug(slug);
  if (!post) {
    return { post: null, relatedPosts: [], latestPosts: [] };
  }
  const relatedPosts = await BlogService.getRelatedPosts(post);
  const { posts: latestPosts } = await BlogService.getPosts({ per_page: 6 });
  // Filter out the current post from latest posts
  const filteredLatestPosts = latestPosts.filter(p => p.id !== post.id);
  return { post, relatedPosts, latestPosts: filteredLatestPosts };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await BlogService.getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The post you are looking for does not exist.',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { post, relatedPosts, latestPosts } = await getPostData(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 pt-16 pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(post.published_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>{post.read_time} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Article Content */}
          <div className="lg:col-span-3">
            <article className="prose prose-lg max-w-none prose-gray prose-headings:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-700">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>


          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-8">
              {/* Table of Contents */}
              <TableOfContents content={post.content} />

              {/* Article Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Share Article
                    </Button>

                  </div>
                </CardContent>
              </Card>



              {/* Newsletter Signup */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <h3 className="font-semibold text-gray-900">Subscribe to our newsletter</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>


        {/* Latest Posts */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.slice(0, 6).map((latestPost: BlogPost) => (
              <BlogPostCard key={latestPost.id} post={latestPost} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
