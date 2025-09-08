import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Support & Help Center - RepliFast AI Review Management',
  description: 'Get comprehensive help with RepliFast AI-powered review management platform. Find setup guides, FAQs, troubleshooting tips, and expert support for Google Business Profile integration.',
  keywords: [
    'RepliFast support',
    'AI review management help',
    'Google Business Profile setup',
    'review reply automation',
    'customer review management',
    'business review responses',
    'AI-powered customer service',
    'review management FAQ',
    'Google reviews help',
    'automated review replies'
  ],
  authors: [{ name: 'RepliFast Support Team' }],
  creator: 'RepliFast',
  publisher: 'RepliFast',
  openGraph: {
    title: 'RepliFast Support & Help Center - AI Review Management',
    description: 'Get comprehensive help with RepliFast AI-powered review management platform. Setup guides, FAQs, and expert support available.',
    url: 'https://www.replifast.com/support',
    siteName: 'RepliFast',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-support.png',
        width: 1200,
        height: 630,
        alt: 'RepliFast Support Center - AI Review Management Help'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepliFast Support & Help Center - AI Review Management',
    description: 'Get comprehensive help with RepliFast AI-powered review management platform. Setup guides, FAQs, and expert support available.',
    creator: '@replifast',
    images: ['/og-support.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.replifast.com/support'
  },
  category: 'Customer Support',
  classification: 'Help Documentation'
};
