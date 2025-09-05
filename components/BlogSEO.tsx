import { BlogPost } from '@/types/blog';

interface BlogSEOProps {
  post: BlogPost;
}

export function BlogSEO({ post }: BlogSEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.replifast.com';
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  
  // Calculate word count for reading time validation
  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image ? [
      post.featured_image,
      // Add multiple aspect ratios for better rich snippets
      post.featured_image.replace(/\.(jpg|jpeg|png|webp)$/i, '_16x9.$1'),
      post.featured_image.replace(/\.(jpg|jpeg|png|webp)$/i, '_4x3.$1'),
      post.featured_image.replace(/\.(jpg|jpeg|png|webp)$/i, '_1x1.$1')
    ].filter(Boolean) : undefined,
    author: {
      '@type': 'Person',
      name: post.author.name,
      ...(post.author.avatar && { image: post.author.avatar })
    },
    publisher: {
      '@type': 'Organization',
      name: 'RepliFast',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 600,
        height: 60
      }
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    url: canonicalUrl,
    wordCount: wordCount,
    timeRequired: `PT${post.read_time}M`,
    inLanguage: 'en-US',
    articleSection: post.category,
    keywords: post.tags.join(', '),
    about: post.tags.map(tag => ({ '@type': 'Thing', name: tag }))
  };

  // Breadcrumb structured data
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}