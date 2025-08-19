"use client";

import { PricingSection } from '@/components/PricingSection';
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
import { useRef, useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoModal } from '@/components/VideoModal';
import { Button } from '@/components/ui/button';
import { GoogleReviewCard } from '@/components/GoogleReviewCard';
import { Footer } from '@/components/Footer';
import { PublicNavigation } from '@/components/PublicNavigation';
import { HowItWorksSteps } from '@/components/HowItWorksSteps';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Head from 'next/head';
import Image from 'next/image';

// Declare global particlesJS
declare global {
  interface Window {
    particlesJS: {
      load: (id: string, path: string, callback?: () => void) => void;
    };
  }
}

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
    title: "Daily auto-sync",
    description: "New reviews are fetched automatically every day at the time you choose, so you never have to worry about missing updates.",
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

// Why reviews matter cards
const reviewMatters = [
  {
    title: "Show customers you care",
    description: "Let customers know you value their feedback and are paying attention to their experience.",
    icon: <Heart className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Build trust with new customers",
    description: "Public replies help potential customers feel confident in choosing your business.",
    icon: <UserCheck className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Boost local SEO",
    description: "Regular replies keep your profile active and can improve your search rankings.",
    icon: <Search className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Recover unhappy customers",
    description: "Responding well to negative feedback can turn one-time complaints into long-term loyalty.",
    icon: <RefreshCw className="h-6 w-6 text-blue-400" />
  }
];

// Benefits for different business types
const benefits = [
  {
    title: "Handle reviews in minutes, not hours",
    description: "Stop manually crafting replies and focus on what matters most.",
    icon: <Clock className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Improve response rate and consistency",
    description: "Never miss a review again and maintain professional standards.",
    icon: <TrendingUp className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Keep your profile looking active and cared for",
    description: "Show customers you value their feedback with timely responses.",
    icon: <Shield className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Boost local SEO without lifting a finger",
    description: "Active review engagement improves your search rankings automatically.",
    icon: <Star className="h-6 w-6 text-blue-400" />
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
  { id: "pricing", title: "Pricing" },
  { id: "contact", title: "Contact" }
];


// Sample reviews for showcase
const sampleReviews = [
  {
    userName: "Tommy Fearn",
    userRole: "Local Guide",
    userReviewCount: 17,
    userPhotoCount: 14,
    userAvatar: "/icons/tommy.jpeg",
    rating: 5,
    reviewText: "Love this shop! Bought my first surfboard from here, and they were super helpful making sure I found the right one. Also got a bag for the board and they went to their stock room to double check as we thought there weren't any in stock but they found it for me.",
    reviewDate: "a month ago",
    replyText: "Thanks for dropping by, Tommy. Glad we could help you pick out your first board and track down that bag in the stock room. Hope the board's treating you well! Enjoy the waves.",
    replyDate: "a month ago"
  },
  {
    userName: "Sarah Chen",
    userRole: "Local Guide",
    userReviewCount: 32,
    userPhotoCount: 8,
    userAvatar: "/icons/sarah.jpeg",
    rating: 4,
    reviewText: "Great coffee and friendly staff! The atmosphere is perfect for working on my laptop. Only minor complaint is that it can get quite noisy during peak hours, but overall a solid choice for a local café.",
    reviewDate: "2 weeks ago",
    replyText: "Hi Sarah, good to hear you've been enjoying the coffee and using the café as a work spot. You're right about the noise when it gets busy. It's something we're keeping an eye on. Thanks for pointing it out and for spending time with us.",
    replyDate: "2 weeks ago"
  },
  {
    "userName": "Karen Simmons",
    "userReviewCount": 15,
    "userPhotoCount": 4,
    "userAvatar": "/icons/karen.jpeg",
    "rating": 3,
    "reviewText": "The staff was friendly and helpful, but my order took much longer than expected and one item wasn't quite right. I appreciate the effort, but I was hoping for a smoother experience.",
    "reviewDate": "2 weeks ago",
    "replyText": "Karen, thanks for sharing both the good and the not-so-good. I'm glad our staff made you feel welcome, but I'm sorry about the wait and the mistake with your order. That's not the experience we want for anyone. If you give us another chance, we'll work to make it a smoother visit.",
    "replyDate": "2 weeks ago"
  }
];

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    // Simple particles.js initialization
    const initParticles = async () => {
      // Load the script dynamically
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
      script.onload = () => {
        if (window.particlesJS) {
          window.particlesJS.load('particles-js', '/particlesjs-config.json');
        }
      };
      document.head.appendChild(script);
    };

    initParticles();
  }, []);

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
      <PublicNavigation
        navigationSections={navigationSections}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        showScrollLinks={true}
      />

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-primary/40 via-accent/20 to-secondary/20 ">
        <div id="particles-js" className="absolute inset-0 z-0 dark:opacity-30" />
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
{/*               <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
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
              </div> */}

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
                    className="px-8 py-4 text-lg mb-2"
                    variant="primary"
                  >
                    Start now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  {/* <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No credit card required</p> */}
                </div>
{/*                 <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-4 text-lg"
                >
                  Watch a quick demo
                </Button> */}
              </motion.div>
            </motion.div>

            {/* Review Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-24 relative"
            >
              <div className="relative mx-auto max-w-6xl">
                {/* Toggle Section */}
                <div className="relative text-center mb-5">
                  <div className="inline-flex items-center bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setShowReplies(false)}
                      className={`px-6 py-3  rounded-full text-sm font-medium transition-all duration-200 ${
                        !showReplies
                          ? 'bg-slate-100  text-muted-foreground dark:text-slate-300 border border-slate-200 dark:bg-slate-700'
                          : 'text-slate-600 border dark:border-transparent border-white dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Without Replies
                    </button>
                    <button
                      onClick={() => setShowReplies(true)}
                      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                        showReplies
                          ? 'bg-primary border border-primary text-white'
                          : 'text-slate-600 border dark:border-transparent border-white dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      With Replies
                    </button>
                  </div>

                  {/* Arrow pointing to toggle */}
                  <div className="absolute -top-40 left-1/2 transform translate-x-36 flex flex-col items-center">
                    <div className="translate-y-16">
                      <p className="text-xl text-slate-600 dark:text-slate-200 translate-x-16 font-medium max-w-[200px] text-center leading-tight font-indie-flower">
                        See the difference replies make to your reputation
                      </p>
                    </div>
                    <motion.div
                      animate={{
                        x: [0, -8, 0],
                        y: [0, 2, 0]
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    >
                      <Image
                        src="/arrow.png"
                        alt="Click to toggle"
                        width={190}
                        height={190}
                        className="transform rotate-[25deg] filter drop-shadow-lg block dark:hidden opacity-80"
                      />
                      <Image
                        src="/arrow_white.png"
                        alt="Click to toggle"
                        width={190}
                        height={190}
                        className="transform rotate-[25deg] filter drop-shadow-lg hidden dark:block"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Review Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sampleReviews.map((review, index) => (
                    <motion.div
                      key={review.userName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={heroInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                    >
                      <GoogleReviewCard
                        userName={review.userName}
                        userRole={review.userRole}
                        userReviewCount={review.userReviewCount}
                        userPhotoCount={review.userPhotoCount}
                        userAvatar={review.userAvatar}
                        rating={review.rating}
                        reviewText={review.reviewText}
                        reviewDate={review.reviewDate}
                        showReply={showReplies}
                        replyText={review.replyText}
                        replyDate={review.replyDate}
                        className="h-full"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Impact Note */}
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-center mt-8"
                  >
                    <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reviews with replies build 3x more trust with potential customers
                    </div>
                  </motion.div>
                )}
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
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6"
            >
              ⚡ Key Features
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Too busy to respond to every review?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              We get it. You are juggling customers, staff, suppliers, and a hundred daily tasks. Review replies often fall to the bottom of the list or get forgotten entirely. That can cost you trust, repeat business, and even your search ranking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section id="benefits" className="py-24 bg-background">
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
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6"
            >
              💬 Customer Engagement
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why replying to reviews matters
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Every review is an opportunity to strengthen your reputation and connect with customers. When you reply consistently and thoughtfully, you build trust, improve your visibility, and turn more first-time buyers into loyal customers.
            </p>


          </motion.div>

          {/* Why Reviews Matter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {reviewMatters.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (index + 1) }}
                className="relative p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-md text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

            {/* Statistics Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-primary/10 dark:to-primary/20 rounded-2xl border border-blue-200 dark:border-primary/50"
              >
                <div className="text-3xl font-bold text-blue-600 dark:text-primary mb-2">89%</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 font-light">
                  of consumers are highly likely to use a business that responds to all its online reviews
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  — <a href="https://www.brightlocal.com/research/local-consumer-review-survey/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 underline">BrightLocal, 2023</a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-accent/10 dark:to-accent/20 rounded-2xl border border-green-200 dark:border-accent/50"
              >
                <div className="text-3xl font-bold text-green-600 dark:text-accent mb-2">Better</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 font-light">
                  ratings over time when businesses actively respond to reviews
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  — <a href="https://hbr.org/2018/02/study-replying-to-customer-reviews-results-in-better-ratings" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 dark:hover:text-green-400 underline">Harvard Business Review</a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-secondary/10 dark:to-secondary/15 rounded-2xl border border-purple-200 dark:border-purple-700/50"
              >
                <div className="text-3xl font-bold text-purple-600 dark:text-secondary mb-2">Higher</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 font-light">
                  local search rankings for businesses that respond to reviews
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  — <a href="https://support.google.com/business/answer/7091?hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 underline">Google</a>
                </div>
              </motion.div>
            </div>
          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/10 rounded-2xl p-8 lg:p-12 text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl lg:text-xl font-thin text-slate-900 dark:text-white mb-6">
              &ldquo;RepliFast has completely taken the stress out of reviews for us. We are replying faster, our customers notice, and our search ranking has gone up too.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Image src="/icons/jahshaka.avif" alt="Jah Shaka Surf Shop" width={40} height={40} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white">Griff</div>
                <div className="text-slate-600 font-thin text-sm dark:text-slate-300">Jah Shaka Surf Shop</div>
              </div>
            </div>
          </motion.div>


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
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6"
            >
              ✨ Simple Setup Process
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              How it works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Getting started with RepliFast is easy. We guide you through everything and handle the approval process so you can focus on running your business.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <HowItWorksSteps />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-background">
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
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6"
            >
              💳 Pricing Plans
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the plan that fits your business.
            </p>
          </motion.div>

          <PricingSection />

          {/* USP Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-20 max-w-4xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary/5  via-secondary/15 to-primary/5 dark:from-blue-900/10 dark:via-slate-800/20 dark:to-purple-900/10 rounded-3xl p-8 lg:p-12 text-center border border-slate-200/50 dark:border-slate-700/30"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Why RepliFast is different
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Most other review tools come as part of big, expensive packages filled with features many small businesses never use.
              RepliFast does one thing well: replying to reviews.
              That means it's simple to use and priced fairly: built for small businesses who want results without the heavy monthly fees.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">No bloated feature packs you don't need</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">Focused only on review replies</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">Priced for small businesses</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-[#0B1120]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center mb-16"
        >
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
        Why businesses choose RepliFast
        </h3>
        </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-md text-slate-600 dark:text-slate-400">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
          </div>
      </section>
      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary/45 via-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 dark:bg-grid-white/10 bg-[length:40px_40px] bg-slate-700/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-4">
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
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
                  className="bg-white text-primary hover:bg-slate-50 px-6 py-4 text-lg font-semibold mb-2"
                >
                  Start now
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-sm opacity-80 mb-4">No credit card required</p>
              </div>
{/*               <Button
                size="lg"
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                Watch a quick demo
              </Button> */}
            </div>

            <div className="mt-5 flex items-center justify-center space-x-6 text-sm opacity-80">
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
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Left Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Frequently asked questions
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                <button
                  onClick={() => router.push('/contact')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                >
                  Contact us via support
                </button> if you have any more questions.
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
                <AccordionItem value="item-1" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-6 text-lg font-medium">
                    What is RepliFast?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 text-base leading-relaxed">
                    RepliFast is an AI-powered review management platform that automatically generates professional responses to your Google Business Profile reviews. It helps you save time while maintaining consistent engagement with your customers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-6 text-lg font-medium">
                    How can I get started?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 text-base leading-relaxed">
                    Simply sign up for a free trial, connect your Google Business Profile, and customize your response tone. RepliFast will start generating replies for your reviews automatically. You can approve or edit responses before they&apos;re posted.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-6 text-lg font-medium">
                    Do I need to approve every reply?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 text-base leading-relaxed">
                    You have full control over your replies. You can choose to approve each response individually, set up auto-approval for 4 and 5-star reviews, or use bulk approval features to manage multiple responses at once.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-6 text-lg font-medium">
                    Can I customize the tone of responses?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 text-base leading-relaxed">
                    Absolutely! RepliFast allows you to customize your brand voice and response tone. Whether you prefer friendly, formal, or something in between, our AI adapts to match your business personality and communication style.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-6 text-lg font-medium">
                    What is your refund policy?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 text-base leading-relaxed">
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

      {/* Footer */}
      <Footer />
    </>
  );
}
