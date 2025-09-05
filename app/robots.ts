import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',           // Block all API routes
          '/login*',          // Block login and related auth pages
          '/reset-password*', // Block password reset pages
          '/verify-email*',   // Block email verification pages
          '/update-password*', // Block password update pages
          '/pay*',            // Block payment pages
          '/dashboard*',      // Block protected dashboard pages
          '/reviews*',        // Block protected review management pages
          '/help*',           // Block protected help pages (if user-specific)
          '/settings*',       // Block protected settings pages
          '/insights*',       // Block protected insights pages
        ],
      },
    ],
    sitemap: 'https://www.replifast.com/sitemap.xml',
    host: 'https://www.replifast.com',
  };
}
