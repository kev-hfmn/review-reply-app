'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Heart, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useThemeSafe } from '@/hooks/useThemeSafe';
import Image from 'next/image';
import { showCookiePreferences } from '@/lib/cookieConsent';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme, toggleTheme } = useThemeSafe();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'Reviews', href: '/reviews' },
      { name: 'Dashboard', href: '/dashboard' }
    ],
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
    <footer className="bg-secondary text-primary-foreground py-12 md:py-16">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12">
          {/* Main Content Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="lg:max-w-sm"
          >
            <div className="flex items-center mb-4">
              <Image src="/icons/icon.png" alt="RepliFast Logo" width={32} height={32} className="mr-2 rounded-md" />
              <span className="text-xl font-semibold">RepliFast</span>
            </div>
            <p className="text-sm text-primary-foreground/80 mb-4 leading-relaxed">
              AI-powered review management for small businesses. Automate Google Business Profile replies with intelligent, personalized responses.
            </p>
            <p className="text-sm text-primary-foreground/60 mb-6 font-light">
              RepliFast is a product of Soulrise LLC
            </p>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.location.href = "/login"}
                className="text-primary-foreground dark:border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors text-sm"
                variant="outline"
              >
                Sign Up
              </Button>
              <Button
                onClick={() => window.location.href = "mailto:hello@replifast.com"}
                className="text-primary-foreground dark:border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors text-sm"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Us
              </Button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-2 mt-6">
              <Sun className="h-4 w-4 text-primary-foreground/80" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
                className="data-[state=checked]:bg-card"
              />
              <Moon className="h-4 w-4 text-primary-foreground/80" />
            </div>
          </motion.div>

          {/* Link Columns Wrapper */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:flex lg:gap-16">
            {/* Product Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => showCookiePreferences()}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left"
                  >
                    Manage Cookies
                  </button>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-center items-center text-center gap-4"
          >
            <p className="text-sm text-primary-foreground/60">
              &copy; {currentYear} Soulrise LLC. All rights reserved.
            </p>
            <div className="flex items-center space-x-1.5 text-sm text-primary-foreground/60">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>for small businesses</span>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
