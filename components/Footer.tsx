'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Heart, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import { showCookiePreferences } from '@/lib/cookieConsent';
import { Button } from '@/components/ui/button';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme, toggleTheme } = useTheme();

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
    <footer className="bg-sidebar-primary border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Link href="/" className="flex items-center space-x-1 mb-4">
              <Image
                src="/icons/icon.png"
                alt="RepliFast"
                width={30}
                height={30}
                className="rounded-md"
              />
                  <span className="text-xl font-bold leading-tight text-primary-foreground">
                    RepliFast
                  </span>
                </Link>
                <p className="text-primary-foreground mb-4 max-w-sm">
                  AI-powered review management for small businesses. Automate Google Business Profile replies with intelligent, personalized responses.
                </p>
                <p className="text-sm text-primary-foreground mb-6">
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
                <div className="flex items-center gap-2 mt-4">
                  <Sun className="h-4 w-4 text-primary-foreground" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                    aria-label="Toggle theme"
                    className="data-[state=checked]:bg-card"
                  />
                  <Moon className="h-4 w-4 text-primary-foreground" />
                </div>
              </motion.div>
            </div>

            {/* Product Links */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
                  Product
                </h3>
                <ul className="space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Support Links */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
                  Support
                </h3>
                <ul className="space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Legal Links */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
                  Legal
                </h3>
                <ul className="space-y-3">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => showCookiePreferences()}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm text-left"
                    >
                      Manage Cookies
                    </button>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-foreground/60 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col lg:flex-row justify-center items-center space-y-4 lg:space-y-0"
          >
            <div className="flex flex-col md:flex-row items-center space-x-4">
              <p className="text-sm text-primary-foreground">
                © {currentYear} Soulrise LLC. All rights reserved.
              </p>
              <div className="flex items-center space-x-1 text-sm text-primary-foreground">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 fill-current" />
                <span>for small businesses</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </footer>
  );
}
