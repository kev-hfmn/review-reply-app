"use client";

import { useState } from 'react';
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

interface ContactFormData {
  businessName: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    businessName: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Navigation sections for the public nav
  const navigationSections = [
    { id: "home", title: "Home" },
    { id: "features", title: "Features" },
    { id: "benefits", title: "Benefits" },
    { id: "pricing", title: "Pricing" },
    { id: "contact", title: "Contact" }
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
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual webhook URL
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubmitted(true);
      setFormData({ businessName: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.businessName.trim() && formData.email.trim() && formData.message.trim();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] relative">
        {/* Navigation */}
        <PublicNavigation
          navigationSections={navigationSections}
          showScrollLinks={false}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#0B1120] dark:via-[#0B1120] dark:to-[#1a1a2e]">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/40 bg-[length:40px_40px] opacity-30" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="pt-10 pb-16 sm:pt-20 sm:pb-24">
              <motion.div
                ref={heroRef}
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium mb-8">
                  <Mail className="h-4 w-4 mr-2" />
                  Get in Touch
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                  Contact us
                </h1>

                <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300">
                  Have questions about RepliFast? Need help getting started? We're here to help you streamline your review management process.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-24 bg-slate-50 dark:bg-[#0f1629]">
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
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Let's start a conversation
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300">
                    Whether you're looking to get started with RepliFast or need support with your existing account, our team is ready to help.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Email Support
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        Get help with your account, billing, or technical questions.
                      </p>
                      <a
                        href="mailto:support@replifast.com"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        support@replifast.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Quick Response
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
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
                <Card className="shadow-lg rounded-xl border-0 bg-white dark:bg-slate-800/50">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">
                      Send us a message
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                          Message sent successfully!
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                          Thank you for reaching out. We'll get back to you within 24 hours.
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
                          <Label htmlFor="businessName" className="text-slate-900 dark:text-white">
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
                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-slate-900 dark:text-white">
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
                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-slate-900 dark:text-white">
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
                            className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                          />
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

                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
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
        <section className="py-16 bg-white dark:bg-[#0B1120]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Looking for quick answers?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Check out our frequently asked questions for immediate help.
              </p>
              <Button
                onClick={() => window.location.href = '/#faq'}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                View FAQ Section
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
  );
}
