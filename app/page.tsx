import { PricingSection } from '@/components/PricingSection'
import {
  Star,
  TrendingUp,
  Zap,
  Clock,
  Shield,
  Settings,
  ChevronRight,
  CheckCircle,
  Sparkles,
  Heart,
  Search,
  UserCheck,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Image from 'next/image'
import { faqItems } from '@/lib/faq'
import Script from 'next/script'
import Footer from '@/components/Footer'
import { HowItWorksSteps } from '@/components/HowItWorksSteps'
import NavigationWrapper from '@/components/NavigationWrapper';
import { publicNavigationSections } from '@/config/navigation';
import HeroContent from '@/components/HeroContent'
import ReviewShowcase from '@/components/ReviewShowcase'
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection'
import { Button } from '@/components/ui/button'
import { PromoCodeBanner } from '@/components/PromoCodeBanner'
import Link from 'next/link'

const toPlain = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .trim()

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: toPlain(item.question),
    acceptedAnswer: {
      '@type': 'Answer',
      text: toPlain(item.answer).slice(0, 1000),
    },
  })),
}

// Core features of RepliFast
const features = [
  {
    title: "Replies to Google reviews automatically",
    description: "Professional, on‑brand responses are ready instantly so you can focus on running your business instead of drafting replies.",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    bgGradient: "from-blue-500/10 to-purple-500/10"
  },
  {
    title: "Auto-approve rules",
    description: "Runs quietly in the background so you never miss a review, even when you are away or busy with customers.",
    icon: <Star className="h-6 w-6 text-primary" />,
    bgGradient: "from-yellow-500/10 to-orange-500/10"
  },
  {
    title: "Your tone, your way",
    description: "Friendly, formal, or anything in between. Add custom instructions so every reply matches your exact style and brand voice.",
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
    title: "Daily auto-sync from Google",
    description: "New reviews are fetched automatically every day at the time you choose, so you never have to worry about missing updates.",
    icon: <Clock className="h-6 w-6 text-primary" />,
    bgGradient: "from-red-500/10 to-orange-500/10"
  },
  {
    title: "Analytics and sentiment",
    description: "Track reply rates, review trends, and customer sentiment to see exactly how your reputation is improving over time.",
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  }
]

// Why reviews matter cards
const reviewMatters = [
  {
    title: "Show customers you care",
    description: "Responding to Google reviews shows customers you value their feedback and care about their experience. It proves you're listening and strengthens your customer relationships.",
    icon: <Heart className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Build trust with new customers",
    description: "Public replies make your Google business profile look professional and trustworthy. When potential customers see active, thoughtful responses, they feel confident choosing you over competitors.",
    icon: <UserCheck className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Boost local SEO rankings",
    description: "Google favors businesses that engage. Consistent replies keep your profile active, strengthen your visibility in local search, and help you rank higher on Google Maps.",
    icon: <Search className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Recover unhappy customers",
    description: "A timely and empathetic reply to negative feedback can turn a one-time complaint into long-term loyalty, and show others that you take customer care seriously.",
    icon: <RefreshCw className="h-6 w-6 text-blue-400" />
  }
]

// Benefits for different business types
const benefits = [
  {
    title: "Handle reviews in minutes, not hours",
    description: "Stop manually crafting replies and focus on what matters most. RepliFast handles it for you.",
    icon: <Clock className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Improve response rate and consistency",
    description: "Never miss a review again and show up with reliable, professional replies every time.",
    icon: <TrendingUp className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Keep your profile looking active and cared for",
    description: "Show customers their feedback matters and build trust by always staying engaged.",
    icon: <Shield className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Stand out from competitors",
    description: "Customers prefer businesses that reply to reviews. With RepliFast, you'll show you care, and win over those who don't.",
    icon: <Star className="h-6 w-6 text-blue-400" />
  }
]


export default function LandingPage() {
  return (
    <NavigationWrapper navigationSections={publicNavigationSections}>
      {/* Hero Section with Extended Particles Background */}
      <section id="home" className="relative overflow-hidden bg-secondary/20 dark:bg-slate-800 bg-gradient-to-br from-primary/50 via-accent/25 to-secondary/70 ">
        <div id="particles-js" className="absolute inset-0 z-0 dark:opacity-30" />
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/40 bg-[length:40px_40px] opacity-30" />
        {/* Darker overlay for light mode */}

        <div className="relative z-10">
          <HeroContent />
          {/* Review showcase with extended particles background */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-24">
            <ReviewShowcase heroInView={true} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10 lg:mb-16">
            <AnimatedSection direction="scale" delay={0.1} className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6">
              ⚡ Key Features
            </AnimatedSection>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Too busy to respond to every review?
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              We get it. You are juggling customers, staff, suppliers, and a hundred daily tasks. Review replies often fall to the bottom of the list or get forgotten entirely. That can cost you trust, repeat business, and even your search ranking.
            </p>
          </AnimatedSection>

          {/* Desktop: AnimatedGrid */}
          <div className="hidden md:block">
            <AnimatedGrid
              className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
              staggerDelay={0.1}
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="card"
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
                </div>
              ))}
            </AnimatedGrid>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="block md:hidden">
            <div
              className="mobile-scroll-container overflow-x-auto overflow-y-hidden scrollbar-hide pb-4 -mx-4 h-full px-4"
              style={{
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex space-x-4 overflow-y-hidden" style={{ width: 'max-content' }}>
                {features.map((feature, index) => (
                  <AnimatedSection
                    key={feature.title}
                    delay={0.1 + index * 0.1}
                    className="flex-shrink-0 w-[280px] h-full scroll-snap-align-center"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className="relative p-6 bg-card rounded-2xl shadow-lg transition-all duration-300 border border-border group h-full">
                      <div className={`pointer-events-none inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.bgGradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        {feature.icon}
                      </div>
                      <h3 className="pointer-events-none text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="pointer-events-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-muted/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10 lg:mb-16">
            <AnimatedSection direction="scale" delay={0.1} className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6">
              💬 Customer Engagement
            </AnimatedSection>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why replying to Google reviews matters
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Every Google review is a chance to boost your online reputation and connect with customers. When you reply consistently and thoughtfully, you show customers you care, build trust, improve local SEO, and turn first-time buyers into loyal fans.
            </p>
          </AnimatedSection>

          {/* Why Reviews Matter Cards */}
          {/* Desktop: AnimatedGrid */}
          <div className="hidden md:block mb-10 lg:mb-20">
            <AnimatedGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" staggerDelay={0.1}>
              {reviewMatters.map((item) => (
                <div key={item.title} className="card">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-md text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </AnimatedGrid>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="block md:hidden mb-10 lg:mb-20">
            <div
              className="mobile-scroll-container overflow-x-auto overflow-y-hidden scrollbar-hide py-2 pb-4 -mx-4 px-4"
              style={{
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex space-x-4" style={{ width: 'max-content' }}>
                {reviewMatters.map((item, index) => (
                  <AnimatedSection
                    key={item.title}
                    delay={0.1 + index * 0.1}
                    className="flex-shrink-0 w-[260px] scroll-snap-align-center"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className="h-full relative p-5 bg-card rounded-2xl shadow-lg border border-border transition-all duration-300 group">
                      <div className="pointer-events-none inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                        {item.icon}
                      </div>
                      <h3 className="pointer-events-none text-base font-semibold text-slate-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="pointer-events-none text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <AnimatedGrid className="mt-16 lg:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6 max-w-4xl mx-auto" staggerDelay={0.1}>
            <div className="text-center h-full p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-primary/10 dark:to-primary/20 rounded-2xl border border-blue-200 dark:border-primary/50 hover:scale-105 hover:rotate-3 transition-all duration-300">
              <div className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-primary mb-2">89%</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-light">
                of consumers are highly likely to use a business that responds to all its online reviews
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                — <a href="https://www.brightlocal.com/research/local-consumer-review-survey/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 underline">BrightLocal, 2023</a>
              </div>
            </div>

            <div className="text-center h-full p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-accent/10 dark:to-accent/20 rounded-2xl border border-green-200 dark:border-accent/50 hover:scale-105 hover:-rotate-3 transition-all duration-300">
              <div className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-accent mb-2">Better</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-light">
                ratings over time when businesses actively respond to reviews
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                — <a href="https://hbr.org/2018/02/study-replying-to-customer-reviews-results-in-better-ratings" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 dark:hover:text-green-400 underline">Harvard Business Review, 2018</a>
              </div>
            </div>

            <div className="text-center h-full p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-600/10 dark:to-purple-400/10 rounded-2xl border border-purple-200 dark:border-purple-700/50 hover:scale-105 hover:rotate-3 transition-all duration-300">
              <div className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-600 mb-2">Higher</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-light">
                local search rankings for businesses that respond to reviews
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                — <a href="https://support.google.com/business/answer/7091?hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 underline">Google</a>
              </div>
            </div>
          </AnimatedGrid>

          {/* Testimonial */}
          <AnimatedSection className="mt-16 lg:mt-20  bg-card rounded-2xl border border-border p-6 md:p-8 lg:p-12 text-center max-w-4xl mx-auto shadow-lg hover:shadow-none hover:bg-background/20 transition-all duration-300">
            <div className="flex justify-center md:mb-6 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-md lg:text-xl font-light text-slate-900 dark:text-white mb-6">
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
          </AnimatedSection>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-10 lg:mb-10">
            <AnimatedSection direction="scale" delay={0.1} className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6">
              ✨ Simple Setup Process
            </AnimatedSection>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              How it works
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Getting started with RepliFast is easy. We guide you through everything and handle the approval process so you can focus on running your business.
            </p>
          </AnimatedSection>

          <div className="max-w-6xl mx-auto">
            <HowItWorksSteps />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center md:mb-10">
            <AnimatedSection direction="scale" delay={0.1} className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6">
              💳 Pricing Plans
            </AnimatedSection>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Choose the plan that fits your business.
            </p>
          </AnimatedSection>

          {/* Launch Discount Banner */}
          <AnimatedSection
            delay={0.2}
            className="mb-8 md:mb-12 max-w-4xl mx-auto"
          >
            <PromoCodeBanner />
          </AnimatedSection>

          <PricingSection />

          {/* USP Section */}
          <AnimatedSection
            delay={0.3}
            className="mt-12 lg:mt-20 max-w-4xl mx-auto shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 dark:from-blue-900/10 dark:via-slate-800/20 dark:to-purple-900/10 rounded-3xl p-6 md:p-8 lg:p-12 text-center border border-accent/25"
          >
            <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mb-6">
              What makes RepliFast different?
            </h3>
            <p className="md:text-lg text-left font-light md:text-center text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8 leading-snug lg:leading-snug">
              Most other review tools come as part of big, expensive packages filled with features many small businesses never use.
              RepliFast does one thing well: replying to reviews.<br />
              That means it&apos;s simple to use and priced fairly: built for small businesses who want results without the heavy monthly fees.
            </p>

            <div className="flex flex-col sm:flex-row items-start justify-start md:items-center text-left md:text-center md:justify-center gap-3 lg:gap-6 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-normal text-left">No bloated feature packs you don&apos;t need</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-normal text-left">Focused only on review replies</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-normal text-left">Priced for small businesses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-normal text-left">Never miss a review again</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="why-replifast" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={0.1} className="text-center mb-10 lg:mb-16">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Why businesses choose RepliFast
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Small business owners choose RepliFast because it saves them several hours each month, keeps their Google Business Profile active, and helps them build trust with every reply.
            </p>
          </AnimatedSection>

          {/* Desktop: AnimatedGrid */}
          <div className="hidden md:block">
            <AnimatedGrid className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6" staggerDelay={0.1}>
              {benefits.map((benefit) => (
                <div key={benefit.title} className="card">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-md text-slate-600 dark:text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </AnimatedGrid>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="block md:hidden">
            <div
              className="mobile-scroll-container overflow-x-auto overflow-y-hidden scrollbar-hide py-2 pb-4 -mx-4 px-4"
              style={{
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex space-x-4" style={{ width: 'max-content' }}>
                {benefits.map((benefit, index) => (
                  <AnimatedSection
                    key={benefit.title}
                    delay={0.1 + index * 0.1}
                    className="flex-shrink-0 w-[260px] scroll-snap-align-center"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className="relative p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 transition-all duration-300 group h-full">
                      <div className="pointer-events-none inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4 group-hover:bg-blue-500/30 transition-all duration-300">
                        {benefit.icon}
                      </div>
                      <h3 className="pointer-events-none text-base font-semibold text-slate-900 dark:text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="pointer-events-none text-sm text-slate-600 dark:text-slate-400">
                        {benefit.description}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/80 to-secondary/50 via-accent/70 relative overflow-hidden">
        <div className="absolute inset-0 dark:bg-grid-white/10 bg-[length:40px_40px] bg-slate-700/50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-4">
            <AnimatedSection direction="scale" delay={0.1} className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
              🚀 Get Started Now
            </AnimatedSection>
          </div>
          <AnimatedSection className="text-center text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Keep your reviews working for you
            </h2>
            <p className="text-xl opacity-95 mb-10 max-w-2xl mx-auto">
              Join other business owners who have put their review replies on autopilot. Start today and see the difference in a week.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex flex-col items-center">
                <Button
                  variant="primary"
                  asChild
                  className="group text-md shadow-lg hover:shadow-none transition-all duration-300 hover:scale-[1.02]"
                  size="xl"
                >
                  <a href="/login">
                    Let RepliFast handle your replies
                    <ChevronRight className="h-5 w-5 ml-0 group-hover:translate-x-2 transition-transform" />
                  </a>
                </Button>

              </div>
            </div>

            <div className="mt-5 flex items-center justify-center space-x-6 text-sm opacity-80">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                14-day money-back guarantee
              </div>

              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Cancel anytime
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 h-full relative">
              <div className="sticky top-32">
                <AnimatedSection direction="left">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                    Frequently asked questions
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                    <a
                      href="/contact"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                    >
                      Contact us
                    </a> if you have any more questions.
                  </p>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                    Or visit our <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer transition-colors">Support center</Link> for more information and detailed instructions.
                  </p>
                </AnimatedSection>
              </div>
            </div>

            {/* Right Content */}
            <AnimatedSection direction="right" delay={0.2} className="lg:col-span-2">
              <Accordion type="single" collapsible className="w-full space-y-2 lg:space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index + 1}`}
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-lg px-6 hover:scale-[1.01] transition-all duration-200"
                  >
                    <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:text-accent dark:hover:text-accent py-4 md:text-lg font-normal">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 text-base leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </NavigationWrapper>
  )
}
