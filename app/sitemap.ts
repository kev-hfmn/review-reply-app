import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://replifast.com';
  const currentDate = new Date();

  return [
    // Main landing page - highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Public contact page - good for SEO
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Legal/compliance pages - good for trust and compliance
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    // Note: Removed auth pages (/login, /reset-password, /verify-email) and payment pages (/pay)
    // These should not be indexed by search engines as they're private/functional pages
  ];
}