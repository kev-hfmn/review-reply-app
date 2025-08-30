import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { BlogService } from '@/lib/services/blogService';
import { BlogPostCard } from '@/components/BlogPostCard';

export const metadata: Metadata = {
  title: 'Blog | RepliFast - Customer Review Management Insights',
  description: 'Discover expert insights, best practices, and industry news for customer review management, business growth, and reputation building.',
  openGraph: {
    title: 'Blog | RepliFast - Customer Review Management Insights',
    description: 'Discover expert insights, best practices, and industry news for customer review management, business growth, and reputation building.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | RepliFast - Customer Review Management Insights',
    description: 'Discover expert insights, best practices, and industry news for customer review management, business growth, and reputation building.',
  },
};

async function getBlogPosts() {
  const { posts } = await BlogService.getPosts({});
  return posts;
}

export default async function BlogPage() {
  const posts: BlogPost[] = await getBlogPosts();

  const featuredPost = posts.find((post: BlogPost) => post.is_featured);
  const regularPosts = posts.filter((post: BlogPost) => !post.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/40 to-accent-foreground/60">
      {/* Hero Section */}
      <div className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-background/50 text-muted-foreground border-border">
              Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-snug">
            Smart Reputation Tips for Small Businesses
            </h1>
            <p className="text-xl text-foreground/90 mb-8 max-w-2xl mx-auto">
            Our blog covers everything from customer trust to local SEO: short, clear, and actionable content built for busy business owners who don’t have hours to spare.
            </p>

            {/* Newsletter Signup */}
         {/*    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/70"
              />
              <Button className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8">
                Subscribe
              </Button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-16">
              <Link href={`/blog/${featuredPost.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className="relative h-64 md:h-96">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-amber-500/20 z-10" />
                    <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 text-foreground">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featuredPost.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-white/30 text-muted-foreground border-border hover:bg-white/50 hover:text-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                        {featuredPost.title}
                      </h2>
                      <p className="text-md md:text-lg text-foreground/90 mb-6 max-w-3xl">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-foreground/80">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          <span>{featuredPost.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(featuredPost.published_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{featuredPost.read_time} min read</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post: BlogPost) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
