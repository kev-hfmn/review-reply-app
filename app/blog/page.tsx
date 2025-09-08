import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { BlogService } from '@/lib/services/blogService';
import { BlogPostCard } from '@/components/BlogPostCard';
import { format } from 'date-fns';

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
    <div className="min-h-screen ">
      {/* Hero Section */}
      <div className="relative bg-muted/50 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-primary/20 to-accent/20 dark:from-secondary/10 dark:via-primary/5 dark:to-accent/10" />
        <div className="absolute inset-0 bg-[url(/backgrounds/gentle-stars.svg)] bg-contain invert dark:invert-0 bg-repeat-round opacity-30" />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              RepliFast{' '}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Smart Reputation Tips for Small Businesses. Our blog covers everything from customer trust to local SEO: short, clear, and actionable content built for busy business owners who don’t have hours to spare.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-16">
              <div className="relative bg-muted/30 rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <Link href={`/blog/${featuredPost.slug}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
                    {/* Left Column - Content */}
                    <div className="flex flex-col justify-center p-8 lg:p-12">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="default" className="text-xs font-medium">
                          Featured
                        </Badge>
                        {featuredPost.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <h2 className="text-xl md:text-2xl lg:text-2xl font-semibold mb-4 leading-tight text-foreground group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h2>

                      <p className="text-lg text-muted-foreground mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          <span>{featuredPost.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(new Date(featuredPost.published_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{featuredPost.read_time} min read</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Image */}
                    <div className="relative lg:order-last order-first">
                      {featuredPost.featured_image ? (
                        <div className="relative h-64 lg:h-full w-full">
                          <Image
                            src={featuredPost.featured_image}
                            alt={featuredPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-background/20" />
                        </div>
                      ) : (
                        <div className="relative h-64 lg:h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <div className="text-6xl font-bold text-primary/20">
                            {featuredPost.title.charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
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
