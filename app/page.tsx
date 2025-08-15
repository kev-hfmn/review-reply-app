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
  Settings,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  Heart,
  Search,
  UserCheck,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as ScrollLink } from 'react-scroll';
import { VideoModal } from '@/components/VideoModal';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Head from 'next/head';

// Core features of RepliFast
const features = [
  {
    title: "Replies in seconds",
    description: "Professional, on‑brand responses are ready instantly so you can focus on running your business instead of drafting replies.",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    bgGradient: "from-blue-500/10 to-purple-500/10"
  },
  {
    title: "Set and forget",
    description: "Runs quietly in the background so you never miss a review, even when you are away or busy with customers.",
    icon: <Star className="h-6 w-6 text-primary" />,
    bgGradient: "from-yellow-500/10 to-orange-500/10"
  },
  {
    title: "Your tone, your way",
    description: "Friendly, formal, or anything in between. Add custom instructions so every reply matches your exact style.",
    icon: <Settings className="h-6 w-6 text-primary" />,
    bgGradient: "from-indigo-500/10 to-blue-500/10"
  },
  {
    title: "Bulk approvals",
    description: "Review and approve multiple replies at once. Ideal for businesses with a high volume of reviews.",
    icon: <Zap className="h-6 w-6 text-primary" />,
    bgGradient: "from-purple-500/10 to-pink-500/10"
  },
  {
    title: "Real‑time sync",
    description: "Stay up to date with instant notifications the moment a new review appears on your Google profile.",
    icon: <Clock className="h-6 w-6 text-primary" />,
    bgGradient: "from-red-500/10 to-orange-500/10"
  },
  {
    title: "Performance insights",
    description: "Track reply rates, review trends, and customer sentiment to see exactly how your reputation is improving over time.",
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  }
];

// Benefits for different business types
const benefits = [
  {
    title: "Save 10+ hours each week",
    description: "Stop manually crafting replies and focus on what matters most.",
    icon: <Clock className="h-8 w-8 text-blue-500" />
  },
  {
    title: "Improve response rate and consistency",
    description: "Never miss a review again and maintain professional standards.",
    icon: <TrendingUp className="h-8 w-8 text-green-500" />
  },
  {
    title: "Keep your profile looking active and cared for",
    description: "Show customers you value their feedback with timely responses.",
    icon: <Shield className="h-8 w-8 text-purple-500" />
  },
  {
    title: "Boost local SEO without lifting a finger",
    description: "Active review engagement improves your search rankings automatically.",
    icon: <Star className="h-8 w-8 text-yellow-500" />
  }
];

// Social proof metrics
const metrics = [
  { value: "50,000+", label: "reviews managed" },
  { value: "98%", label: "customer satisfaction with replies" },
  { value: "10+", label: "hours saved every week" },
  { value: "24/7", label: "works in the background" }
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
        <title>RepliFast - AI-Powered Google Review Management for Small Business</title>
        <meta name="description" content="Save 10+ hours per week with AI-generated Google review replies. Manage all your customer feedback in one dashboard. Never miss responding to a review again. Start now." />
        <meta name="keywords" content="google reviews, review management, AI replies, customer feedback, business reputation, review automation, small business" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="RepliFast - AI-Powered Google Review Management" />
        <meta property="og:description" content="Turn customer feedback into business growth with AI-powered review replies. Save time and never miss responding to a review." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RepliFast - AI Review Management" />
        <meta name="twitter:description" content="Save 10+ hours per week with AI-generated Google review replies. Start now." />
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
              <span className="text-xl font-bold text-slate-900 dark:text-white">RepliFast</span>
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
                    Start now
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
                Never Miss a Review Again
              </h1>

              <p className="mt-8 max-w-3xl mx-auto text-xl text-slate-600 dark:text-slate-300">
                Running your business leaves little time for everything else. RepliFast replies to your Google reviews automatically, in your own tone, so you can focus on what matters most and still keep customers happy.
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
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg mb-2"
                  >
                    Start now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No credit card required</p>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-4 text-lg"
                >
                  Watch a quick demo
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
                    <div className="text-slate-400 text-sm">RepliFast Dashboard</div>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
            >
              ⚡ Key Features
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Too busy to respond to every review?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              We get it. You are juggling customers, staff, suppliers, and a hundred daily tasks. Review replies often fall to the bottom of the list or get forgotten entirely. That can cost you trust, repeat business, and even your search ranking.
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
      <section id="benefits" className="py-24 bg-slate-900 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
            >
              💬 Customer Engagement
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why replying to reviews matters
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Every review is an opportunity to strengthen your reputation and connect with customers. When you reply consistently and thoughtfully, you build trust, improve your visibility, and turn more first-time buyers into loyal customers.
            </p>
          </motion.div>

          {/* Why Reviews Matter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                <Heart className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Show customers you care
              </h3>
              <p className="text-sm text-slate-300">
                Let customers know you value their feedback and are paying attention to their experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                <UserCheck className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Build trust with new customers
              </h3>
              <p className="text-sm text-slate-300">
                Public replies help potential customers feel confident in choosing your business.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                <Search className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Boost local SEO
              </h3>
              <p className="text-sm text-slate-300">
                Regular replies keep your profile active and can improve your search rankings.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                <RefreshCw className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Recover unhappy customers
              </h3>
              <p className="text-sm text-slate-300">
                Responding well to negative feedback can turn one-time complaints into long-term loyalty.
              </p>
            </motion.div>
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
              &ldquo;RepliFast has completely taken the stress out of reviews for us. We are replying faster, our customers notice, and our search ranking has gone up too.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">Griff</div>
                <div className="text-slate-600 dark:text-slate-300">Jah Shaka Surf Shop</div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mt-20">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-8 bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 group text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-32 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-[#0B1120] dark:via-slate-900/80 dark:to-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
            >
              ✨ Simple Setup Process
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-6">
              How it works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Getting started with RepliFast is easy. We guide you through everything and handle the approval process so you can focus on running your business.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Connection Line - Height limited to connect only between steps */}
              <div className="absolute left-8 top-8 h-[calc(100%-8rem)] w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-400 dark:from-blue-800 dark:via-blue-700 dark:to-blue-600 hidden lg:block"></div>

              <div className="space-y-6">
                {/* Step 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="relative"
                >
                  <div className="flex items-start space-x-8">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-500/30">
                        1
                      </div>
                    </div>
                    <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-slate-700/50 shadow-xl">
                      <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-4">
                        We request approval from Google for you
                      </h4>
                      <p className="text-md text-slate-600 dark:text-slate-300 leading-relaxed">
                        Google requires each business to approve access before review management tools like ours can connect. We take care of the request process on your behalf so you don&apos;t have to deal with any of the technical steps.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="relative"
                >
                  <div className="flex items-start space-x-8">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-500/30">
                        2
                      </div>
                    </div>
                    <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-slate-700/50 shadow-xl">
                      <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-4">
                        Google approves your access
                      </h4>
                      <p className="text-md text-slate-600 dark:text-slate-300 leading-relaxed">
                        Once Google approves, you will receive a confirmation. This is the green light for you to connect your account to RepliFast.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="relative"
                >
                  <div className="flex items-start space-x-8">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-500/30">
                        3
                      </div>
                    </div>
                    <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-slate-700/50 shadow-xl">
                      <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-4">
                        Connect and bring in your reviews
                      </h4>
                      <p className="text-md text-slate-600 dark:text-slate-300 leading-relaxed">
                        After approval, you simply enter your Google connection details into RepliFast. From there, you can bring in your existing reviews and start replying to them.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Step 4 */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="relative"
                >
                  <div className="flex items-start space-x-8">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-500/30">
                        4
                      </div>
                    </div>
                    <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-slate-700/50 shadow-xl">
                      <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-4">
                        Keep your reviews up to date
                      </h4>
                      <p className="text-md text-slate-600 dark:text-slate-300 leading-relaxed">
                        From that moment on, new reviews will appear in RepliFast so you can respond quickly and keep your reputation in great shape.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Additional Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-20 relative"
            >
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 lg:p-10 border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">i</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Why individual approvals?
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      We have already applied for general access with Google, which will eventually remove the need for individual approvals. Since this process can take time, we currently follow the individual approval approach so you can start using RepliFast right away.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
            >
              💳 Pricing Plans
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the plan that fits your business.
            </p>
          </motion.div>

          <PricingSection />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-[length:40px_40px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6"
            >
              🚀 Get Started Today
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Keep your reviews working for you
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Join other business owners who have put their review replies on autopilot. Start today and see the difference in a week.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                  className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-4 text-lg font-semibold mb-2"
                >
                  Start now
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-sm opacity-80 mb-4">No credit card required</p>
              </div>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                Watch a quick demo
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm opacity-80">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Only pay after you start using RepliFast
              </div>

              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-900 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Left Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Frequently <span className="text-slate-400">asked questions</span>
              </h2>
              <p className="text-slate-300 mb-4">
                <span className="text-blue-400">Contact us via support</span> if you have any more questions.
              </p>
            </motion.div>

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border-slate-700 bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-white hover:text-blue-400 py-6 text-lg font-medium">
                    What is RepliFast?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-6 text-base leading-relaxed">
                    RepliFast is an AI-powered review management platform that automatically generates professional responses to your Google Business Profile reviews. It helps you save time while maintaining consistent engagement with your customers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-slate-700 bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-white hover:text-blue-400 py-6 text-lg font-medium">
                    How can I get started?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-6 text-base leading-relaxed">
                    Simply sign up for a free trial, connect your Google Business Profile, and customize your response tone. RepliFast will start generating replies for your reviews automatically. You can approve or edit responses before they&apos;re posted.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-slate-700 bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-white hover:text-blue-400 py-6 text-lg font-medium">
                    Do I need to approve every reply?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-6 text-base leading-relaxed">
                    You have full control over your replies. You can choose to approve each response individually, set up auto-approval for 4 and 5-star reviews, or use bulk approval features to manage multiple responses at once.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-slate-700 bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-white hover:text-blue-400 py-6 text-lg font-medium">
                    Can I customize the tone of responses?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-6 text-base leading-relaxed">
                    Absolutely! RepliFast allows you to customize your brand voice and response tone. Whether you prefer friendly, formal, or something in between, our AI adapts to match your business personality and communication style.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-slate-700 bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-white hover:text-blue-400 py-6 text-lg font-medium">
                    What is your refund policy?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 pb-6 text-base leading-relaxed">
                    We offer a 14-day free trial with no credit card required. If you&apos;re not satisfied within the first 30 days of your paid subscription, we&apos;ll provide a full refund. Cancel anytime with no long-term commitments.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
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
