import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.lemonsqueezy.com https://assets.lemonsqueezy.com https://challenges.cloudflare.com https://app.posthog.com https://vercel.live",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://app.lemonsqueezy.com https://challenges.cloudflare.com",
            "img-src 'self' https: data: blob:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co https://api.lemonsqueezy.com https://app.lemonsqueezy.com https://challenges.cloudflare.com https://api.openai.com https://api.brevo.com https://app.posthog.com https://vercel.live wss://*.supabase.co",
            "frame-src 'self' https://app.lemonsqueezy.com https://checkout.lemonsqueezy.com https://challenges.cloudflare.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        },
      ],
    },
  ],
  /* config options here */
};

export default nextConfig;
