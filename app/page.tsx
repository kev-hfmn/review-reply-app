"use client";

import { useAuth } from '@/contexts/AuthContext';
import { PricingSection } from '@/components/PricingSection';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import {
  Star,
  TrendingUp,
  Zap,
  Clock,
  Shield,
  BarChart3,
  Settings,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as ScrollLink } from 'react-scroll';
import { VideoModal } from '@/components/VideoModal';
import { Button } from '@/components/ui/button';
import Head from 'next/head';

// Core features of ReplyDesk
const features = [
  {
    title: "AI-Powered Replies",
    description: "Generate professional, personalized responses to customer reviews in seconds with our advanced AI technology.",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    bgGradient: "from-blue-500/10 to-purple-500/10"
  },
  {
    title: "Smart Review Management",
    description: "Centralize all your Google reviews in one dashboard. Filter, sort, and manage reviews with powerful tools.",
    icon: <Star className="h-6 w-6 text-primary" />,
    bgGradient: "from-yellow-500/10 to-orange-500/10"
  },
  {
    title: "Analytics & Insights",
    description: "Track your reputation metrics, response rates, and customer sentiment with detailed weekly reports.",
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  {
    title: "Bulk Actions",
    description: "Save hours with bulk approve, bulk reply, and automated workflows for high-volume review management.",
    icon: <Zap className="h-6 w-6 text-primary" />,
    bgGradient: "from-purple-500/10 to-pink-500/10"
  },
  {
    title: "Brand Voice Control",
    description: "Customize your AI replies to match your brand voice with tone controls for formality, warmth, and style.",
    icon: <Settings className="h-6 w-6 text-primary" />,
    bgGradient: "from-indigo-500/10 to-blue-500/10"
  },
  {
    title: "Real-time Sync",
    description: "Automatically sync with Google Business Profile and get notifications for new reviews as they come in.",
    icon: <Clock className="h-6 w-6 text-primary" />,
    bgGradient: "from-red-500/10 to-orange-500/10"
  }
];

// Benefits for different business types
const benefits = [
  {
    title: "Save 10+ Hours Per Week",
    description: "Stop manually crafting replies. Our AI generates professional responses instantly.",
    icon: <Clock className="h-8 w-8 text-blue-500" />
  },
  {
    title: "Improve Response Rate by 300%",
    description: "Never miss a review again. Respond to every customer and build stronger relationships.",
    icon: <TrendingUp className="h-8 w-8 text-green-500" />
  },
  {
    title: "Boost Customer Trust",
    description: "Show potential customers you care by responding to all feedback professionally.",
    icon: <Shield className="h-8 w-8 text-purple-500" />
  }
];

// Social proof metrics
const metrics = [
  { value: "50,000+", label: "Reviews Managed" },
  { value: "98%", label: "Customer Satisfaction" },
  { value: "10hrs", label: "Avg. Time Saved/Week" },
  { value: "24/7", label: "AI Assistant Available" }
];

// Navigation sections
const navigationSections = [
  { id: "home", title: "Home" },
  { id: "features", title: "Features" },
  { id: "benefits", title: "Benefits" },
  { id: "pricing", title: "Pricing" }
];

export default function LandingPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("home");
  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <>
      <Head>
        <title>ReplyDesk - AI-Powered Google Review Management for Small Business</title>
        <meta name="description" content="Save 10+ hours per week with AI-generated Google review replies. Manage all your customer feedback in one dashboard. Never miss responding to a review again. Start your free trial today." />
        <meta name="keywords" content="google reviews, review management, AI replies, customer feedback, business reputation, review automation, small business" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="ReplyDesk - AI-Powered Google Review Management" />
        <meta property="og:description" content="Turn customer feedback into business growth with AI-powered review replies. Save time and never miss responding to a review." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ReplyDesk - AI Review Management" />
        <meta name="twitter:description" content="Save 10+ hours per week with AI-generated Google review replies. Start your free trial today." />
        <link rel="canonical" href="https://flowrise-reviews.com" />
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0B1120] relative">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">ReplyDesk</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationSections.map((section) => (
                <ScrollLink
                  key={section.id}
                  to={section.id}
                  spy={true}
                  smooth={true}
                  offset={-100}
                  duration={500}
                  onSetActive={() => setActiveSection(section.id)}
                  className={`cursor-pointer transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {section.title}
                </ScrollLink>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push('/login')} className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                  <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                    Start Free Trial
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#0B1120] dark:via-[#0B1120] dark:to-[#1a1a2e]">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/40 bg-[length:40px_40px] opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-20 pb-24 sm:pt-32 sm:pb-32">
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Review Management
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
                Turn Google Reviews Into
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Business Growth
                </span>
              </h1>

              <p className="mt-8 max-w-3xl mx-auto text-xl text-slate-600 dark:text-slate-300">
                Save 10+ hours per week with AI-generated replies. Manage all your Google reviews in one dashboard and never miss responding to a customer again.
              </p>

              {/* Social Proof Metrics */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={heroInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {metric.value}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {metric.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-4 text-lg"
                >
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-20 relative"
            >
              <div className="relative mx-auto max-w-5xl">
                <div className="relative rounded-2xl bg-slate-900 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-800">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-slate-400 text-sm">ReplyDesk Dashboard</div>
                    <div></div>
                  </div>
                  <div className="p-8">
                    <div className="text-green-400 text-sm leading-relaxed">
                      <TypewriterEffect
                        text={`🌟 New Google Review Received!

"Amazing service! The team went above and beyond to help us with our project. Highly recommended!"
⭐⭐⭐⭐⭐ Sarah M.

🤖 AI Reply Generated:
"Thank you so much for your wonderful review, Sarah! We're thrilled to hear that our team exceeded your expectations. Your feedback means the world to us and motivates us to continue delivering exceptional service. We look forward to working with you again soon!"

✅ Ready to post | 📝 Edit reply | ⚡ Bulk approve`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-[#0f1629]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Manage Reviews
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              From AI-powered responses to detailed analytics, ReplyDesk provides all the tools you need to turn customer feedback into business growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 group`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.bgGradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              The Impact on Your Business
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              See how ReplyDesk transforms the way businesses handle customer feedback and drives measurable results.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 lg:p-12 text-center"
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl lg:text-2xl font-medium text-slate-900 dark:text-white mb-6">
              &ldquo;ReplyDesk has completely transformed how we handle customer feedback. We&apos;ve saved 15+ hours per week and our response rate went from 20% to 95%!&rdquo;
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">Sarah Johnson</div>
                <div className="text-slate-600 dark:text-slate-300">Owner, Bella&apos;s Bistro</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-[#0f1629]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the plan that fits your business. Start with a free trial and upgrade as you grow.
            </p>
          </motion.div>

          <PricingSection />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-[length:40px_40px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Review Management?
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Join thousands of businesses already using ReplyDesk to save time, improve customer relationships, and grow their reputation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-4 text-lg font-semibold"
              >
                Start Your Free Trial
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                Watch Demo
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm opacity-80">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Free 14-day trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="S1cnQG0-LP4"
      />
      </div>
    </>
  );
}
