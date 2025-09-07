import Link from 'next/link';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ContactButtons } from '@/components/ContactButtons';
import { CookieButton } from '@/components/CookieButton';

// Static blog posts - edit these anytime to change footer links
const staticBlogPosts = [
  {
    title: "Automated Google Review Responses: Enhance Your Reputation and Local SEO",
    slug: "automated-google-review-responses-enhance-reputation-local-seo"
  },
  {
    title: "How Automated Review Replies Can Transform Your Business Reputation",
    slug: "how-automated-review-replies-transform-business-reputation"
  },
  {
    title: "How to Respond to Negative Google Reviews: A Complete Guide for Small Businesses",
    slug: "how-to-respond-negative-google-reviews-complete-guide"
  },
  {
    title: "Why Replying to Google Reviews Is Critical for Local Businesses",
    slug: "why-replying-google-reviews-critical-local-businesses"
  }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'Reviews', href: '/reviews' },
      { name: 'Dashboard', href: '/dashboard' }
    ],
    blog: staticBlogPosts.map((post) => ({
      name: post.title,
      href: `/blog/${post.slug}`
    })),
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact', href: '/contact' }
    ]
  };

  return (
    <footer className="bg-sidebar text-foreground py-12 md:py-16 border-t border-muted-foreground/15 shadow-inner">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section - Company Info and Main Links */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 mb-8">
          {/* Main Content Column */}
          <div className="lg:max-w-sm">
            <div className="flex items-center mb-4">
              <Image src="/icons/icon.png" alt="RepliFast Logo" width={32} height={32} className="mr-2 rounded-md" />
              <span className="text-xl font-semibold">RepliFast</span>
            </div>
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              AI-powered review management for small businesses. Automate Google Business Profile replies with intelligent, personalized responses.
            </p>
            <p className="text-sm text-foreground/60 mb-6 font-light">
              RepliFast is a product of Soulrise LLC
            </p>

            <ContactButtons />

            {/* Theme Toggle */}
            <div className="mt-6">
              <ThemeToggle />
            </div>
          </div>

          {/* Main Link Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:flex lg:gap-16">
            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookieButton />
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Blog Posts Section */}
        {staticBlogPosts.length > 0 && (
          <div className="border-t border-foreground/10 pt-8 mb-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Latest from our Blog</h3>
              <p className="text-sm text-foreground/70">
                Tips, insights, and best practices for managing your business reputation.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {footerLinks.blog.slice(0, 4).map((link) => (
                <div key={link.name} className="group">
                  <Link href={link.href} className="block">
                    <h4 className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors mb-2 line-clamp-2 leading-snug">
                      {link.name}
                    </h4>
                    <span className="text-xs text-foreground/60 group-hover:text-foreground/80 transition-colors">
                      Read article →
                    </span>
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/blog"
                className="inline-flex items-center text-sm font-medium text-foreground/90 hover:text-foreground transition-colors"
              >
                View all posts →
              </Link>
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="border-t border-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center text-center gap-4">
            <p className="text-sm text-foreground/60">
              &copy; {currentYear} Soulrise LLC. All rights reserved.
            </p>
            <div className="flex items-center space-x-1.5 text-sm text-foreground/60">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>for small businesses</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
