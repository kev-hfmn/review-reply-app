"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicNavigation } from '@/components/PublicNavigation';
import Footer from '@/components/Footer';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ContactFormData {
  businessName: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const { user } = useAuth();

  const [formData, setFormData] = useState<ContactFormData>({
    businessName: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileError, setTurnstileError] = useState<string>('');

  // Pre-fill email if user is authenticated
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [user, formData.email]);

  useEffect(() => {
    // Define global Turnstile callbacks
    if (typeof window !== 'undefined') {
      (window as any).onTurnstileSuccess = (token: string) => {
        setTurnstileToken(token);
        setTurnstileError('');
      };

      (window as any).onTurnstileExpired = () => {
        setTurnstileToken('');
        setTurnstileError('CAPTCHA expired. Please try again.');
      };

      (window as any).onTurnstileError = () => {
        setTurnstileToken('');
        setTurnstileError('CAPTCHA failed. Please try again.');
      };
    }

    // Load Turnstile script if keys are configured and not already loaded
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Navigation sections for the public nav
  const navigationSections = [
    { id: "home", title: "Home" },
    { id: "features", title: "Features" },
    { id: "pricing", title: "Pricing" },
    { id: "faq", title: "FAQ" },
    { id: "contact", title: "Contact" },
    { id: "blog", title: "Blog" }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only require turnstile token if keys are configured
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setTurnstileError('Please complete the CAPTCHA verification');
      return;
    }

    setIsSubmitting(true);
    setTurnstileError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setIsSubmitted(true);
      setFormData({ businessName: '', email: '', message: '' });
      setTurnstileToken('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setTurnstileError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.businessName.trim() &&
                     formData.email.trim() &&
                     formData.message.trim() &&
                     (turnstileToken || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] relative">
        {/* Navigation */}
        <PublicNavigation
          navigationSections={navigationSections}
          showScrollLinks={false}
        />

        {/* Hero Section */}
        <section className="relative bg-muted/50 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-primary/20 to-accent/20 dark:from-secondary/10 dark:via-primary/5 dark:to-accent/10" />
          <div className="absolute inset-0 bg-[url(/backgrounds/gentle-stars.svg)] bg-contain invert dark:invert-0 bg-repeat-round opacity-30" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="pt-10 pb-16 sm:pt-20 sm:pb-24">
              <motion.div
                ref={heroRef}
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                  <Mail className="h-4 w-4 mr-2" />
                  Get in Touch
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                  Contact us
                </h1>

                <p className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground">
                  Have questions about RepliFast? Need help getting started? We&apos;re here to help you streamline your review management process.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-24 bg-muted/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Side - Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Let&apos;s start a conversation
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Whether you&apos;re looking to get started with RepliFast or need support with your existing account, our team is ready to help.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Email Support
                      </h3>
                      <p className="text-muted-foreground">
                        Get help with your account, billing, or technical questions.
                      </p>
                      <a
                        href="mailto:support@replifast.com"
                        className="text-primary hover:underline font-medium"
                      >
                        support@replifast.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Quick Response
                      </h3>
                      <p className="text-muted-foreground">
                        We typically respond to all inquiries within 24 hours during business days.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Side - Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-lg rounded-xl border-0 bg-card">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl text-foreground">
                      Send us a message
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Fill out the form below and we&apos;ll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          Message sent successfully!
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                        </p>
                        <Button
                          onClick={() => setIsSubmitted(false)}
                          variant="outline"
                        >
                          Send another message
                        </Button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="businessName" className="text-foreground">
                            Business Name *
                          </Label>
                          <Input
                            id="businessName"
                            name="businessName"
                            type="text"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            placeholder="Enter your business name"
                            required
                            className="bg-card border-border focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-foreground">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                            required
                            className="bg-card border-border focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-foreground">
                            Message *
                          </Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Tell us how we can help you..."
                            required
                            rows={5}
                            className="bg-card border-border focus:border-primary resize-none"
                          />
                        </div>

                        {/* CAPTCHA Section */}
                        <div className="space-y-2">
                          <Label className="text-foreground">
                            Verification
                          </Label>
                          <div className="flex justify-center">
                            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                              <div className="w-full max-w-sm">
                                <div
                                  className="cf-turnstile"
                                  data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                                  data-callback="onTurnstileSuccess"
                                  data-expired-callback="onTurnstileExpired"
                                  data-error-callback="onTurnstileError"
                                />
                                {turnstileError && (
                                  <p className="text-sm text-red-500 mt-2 text-center">
                                    {turnstileError}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="bg-muted/50 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30">
                                <p className="text-sm text-muted-foreground text-center">
                                  ✓ CAPTCHA disabled in development
                                  <br />
                                  <span className="text-xs">Set NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={!isFormValid || isSubmitting}
                          className="w-full"
                          variant="primary"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>

                        <p className="text-sm text-muted-foreground text-center">
                          * Required fields
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Links */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Looking for quick answers?
              </h3>
              <p className="text-muted-foreground mb-6">
                Check out our frequently asked questions for immediate help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.location.href = '/#faq'}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  View FAQ Section
                </Button>
                <Button
                  onClick={() => window.location.href = '/help'}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Help Center
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
  );
}
