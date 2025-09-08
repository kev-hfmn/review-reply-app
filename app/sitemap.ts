import type { MetadataRoute } from 'next';
import { BlogService } from '@/lib/services/blogService';
import { getAllHelpSlugs } from '@/data/helpContent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.replifast.com';
  const currentDate = new Date();

  // Get dynamic content
  const helpSlugs = getAllHelpSlugs();

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const { posts } = await BlogService.getPosts({ per_page: 100 });
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error generating blog sitemap entries:', error);
  }

  // Generate help topic pages
  const helpTopicPages = helpSlugs.map(slug => ({
    url: `${baseUrl}/support/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    // Main support page - high SEO priority
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    // Core pages
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Legal pages
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    // Dynamic content
    ...helpTopicPages,
    ...blogPages,
  ];
}
