import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, ShareIcon } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { BlogService } from '@/lib/services/blogService';
import { BlogPostCard } from '@/components/BlogPostCard';
import { TableOfContents } from '@/components/TableOfContents';
import { format } from 'date-fns';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

async function getPostData(slug: string) {
  try {
    const post = await BlogService.getPostBySlug(slug);
    if (!post) {
      return { post: null, relatedPosts: [], latestPosts: [] };
    }

    // Get related posts with error handling
    let relatedPosts: BlogPost[] = [];
    try {
      relatedPosts = await BlogService.getRelatedPosts(post);
    } catch (error) {
      console.error('Error fetching related posts:', error);
      relatedPosts = [];
    }

    // Get latest posts with error handling
    let latestPosts: BlogPost[] = [];
    try {
      const { posts } = await BlogService.getPosts({ per_page: 6 });
      latestPosts = posts.filter(p => p.id !== post.id);
    } catch (error) {
      console.error('Error fetching latest posts:', error);
      latestPosts = [];
    }

    return { post, relatedPosts, latestPosts };
  } catch (error) {
    console.error('Error in getPostData:', error);
    return { post: null, relatedPosts: [], latestPosts: [] };
  }
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
      images: post.featured_image ? [{ url: post.featured_image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { post, latestPosts } = await getPostData(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/60 via-accent/40 to-secondary/40 pt-16 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-background/20 text-foreground/80 border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 !leading-tight">
                {post.title}
              </h1>

              <p className="text-lg md:text-lg text-foreground/90 mb-8">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-foreground/80">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{post.author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{post.read_time} min read</span>
                </div>
              </div>
            </div>

            {/* Right Column - Featured Image */}
            {post.featured_image && (
              <div className="relative">
                <div className="relative h-96 lg:h-[400px] rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Optional overlay for better text readability if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Article Content */}
          <div className="lg:col-span-3">
            <article className="prose prose-lg prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-medium max-w-none prose-gray text-foreground/80 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-blue-600 hover:prose-a:text-blue-700">
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
{/*               <Card className="bg-muted border-border">
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
              </Card> */}
            </div>
          </div>
        </div>


        {/* Latest Posts */}
        <div className="mt-16 pt-16 border-t border-foreground/25">
          <h2 className="text-2xl font-bold text-foreground/80 mb-8">Latest Articles</h2>
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
