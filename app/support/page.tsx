import Link from 'next/link';
import { Search, HelpCircle, BookOpen, MessageSquare, Brain, Palette, Link as LinkIcon, Settings, Zap, Workflow, Shield, CreditCard, DollarSign, AlertTriangle, Headphones, BarChart3, Users } from 'lucide-react';
import { helpTopics, faqItems, helpCategories } from '@/data/helpContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  generateFAQSchema,
  generateWebsiteSchema,
  generateHowToSchema,
  generateOrganizationSchema
} from '@/lib/metadata/schema-generators';

export { metadata } from './metadata';

const iconMap = {
  'HelpCircle': HelpCircle,
  'BookOpen': BookOpen,
  'MessageSquare': MessageSquare,
  'Brain': Brain,
  'Palette': Palette,
  'Link': LinkIcon,
};

const categoryIconMap = {
  'setup': Settings,
  'integration': LinkIcon,
  'ai-features': Brain,
  'automation': Zap,
  'workflow': Workflow,
  'benefits': BarChart3,
  'security': Shield,
  'pricing': DollarSign,
  'billing': CreditCard,
  'troubleshooting': AlertTriangle,
  'support': Headphones,
  'analytics': BarChart3,
  'customization': Palette,
  'collaboration': Users,
  'comparison': BarChart3,
};

export default function SupportPage() {
  const faqJsonLd = generateFAQSchema(faqItems);
  const websiteJsonLd = generateWebsiteSchema();
  const howToJsonLd = generateHowToSchema(helpTopics);
  const organizationJsonLd = generateOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <div className="relative bg-muted/50 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-primary/20 to-accent/20 dark:from-secondary/10 dark:via-primary/5 dark:to-accent/10" />
          <div className="absolute inset-0 bg-[url(/backgrounds/gentle-stars.svg)] bg-contain invert dark:invert-0 bg-repeat-round opacity-30" />

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                RepliFast{' '}
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Support Center
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Stuck on something or getting started? Browse our extensive knowledge base to find answers to your questions. Our support is also available to help you with any questions you may have.
              </p>

              {/* Search Bar */}
              <form
                action="/support/search"
                method="GET"
                className="relative max-w-md  mx-auto"
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none z-10" />
                <Input
                  type="text"
                  name="q"
                  placeholder="Search for help topics and FAQs..."
                  className="pl-12 pr-4 py-4 text-md bg-card/90 backdrop-blur-sm border border-border/50 shadow-md focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 rounded-xl"
                  required
                  minLength={2}
                />
                <button
                  type="submit"
                  className="absolute shadow-md h-full right-0 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16 max-w-6xl">
          {/* Quick Find Answers */}
          <section className="py-24">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Quickfind answers
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {helpTopics.slice(0, 6).map((topic) => {
                const IconComponent = iconMap[topic.icon as keyof typeof iconMap] || HelpCircle;

                return (
                  <Link key={topic.id} href={`/support/${topic.slug}`}>
                    <Card className="h-full border border-border/60 shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] hover:border-primary/60 dark:hover:border-secondary/60 transition-all duration-300 group cursor-pointer">
                      <CardHeader className="text-center pb-6">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-primary/20 group-hover:to-primary/30 dark:group-hover:from-primary/30 dark:group-hover:to-primary/40 transition-all duration-300 shadow-sm">
                            <IconComponent className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                          {topic.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                          {topic.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* General FAQs */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                General FAQs
              </h2>
              <p className="text-lg text-muted-foreground">
                Find answers to commonly asked questions about RepliFast, organized by category
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {/* Group FAQs by category */}
              {Array.from(new Set(faqItems.map(faq => faq.category))).map(category => {
                const categoryFaqs = faqItems.filter(faq => faq.category === category);
                const categoryDisplayName = category.split('-').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' & ');
                const CategoryIcon = categoryIconMap[category as keyof typeof categoryIconMap] || HelpCircle;

                return (
                  <div key={category}>
                    <h3 className="text-xl font-medium text-foreground mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-secondary/80 via-secondary/60 to-secondary/80 rounded-lg flex items-center justify-center text-secondary-foreground">
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      {categoryDisplayName}
                      <span className="text-sm text-muted-foreground ml-0">
                        ({categoryFaqs.length})
                      </span>
                    </h3>

                    <Card className="border border-border/60 shadow-sm bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-0">
                        <Accordion type="multiple" className="w-full">
                          {categoryFaqs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id} className="border-border">
                              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-muted/50 transition-colors">
                                <span className="font-normal text-foreground">
                                  {faq.question}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-4 text-md text-muted-foreground leading-relaxed">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </section>

          {/* All Help Topics by Category */}
          <section className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Browse All Topics
              </h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive guides organized by category
              </p>
            </div>

            <div className="space-y-12">
              {Object.entries(helpCategories).map(([categoryKey, categoryName]) => {
                const categoryTopics = helpTopics.filter(topic => topic.category === categoryKey);

                if (categoryTopics.length === 0) return null;

                return (
                  <div key={categoryKey}>
                    <h3 className="text-xl font-medium text-foreground mb-4 flex items-center gap-3">

                      {categoryName}
                    </h3>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryTopics.map((topic) => {
                        const IconComponent = iconMap[topic.icon as keyof typeof iconMap] || HelpCircle;

                        return (
                          <Link key={topic.id} href={`/support/${topic.slug}`}>
                            <Card className="h-full border border-border/60 hover:border-primary/60 dark:hover:border-secondary/60 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group cursor-pointer bg-card/60 backdrop-blur-sm">
                              <CardHeader className="pb-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-muted/50 to-muted/80 dark:from-muted/20 dark:to-muted/40 rounded-xl flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 dark:group-hover:from-primary/20 dark:group-hover:to-primary/30 transition-all duration-200 shadow-sm">
                                    <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                                      {topic.title}
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-2 text-muted-foreground line-clamp-2 leading-relaxed">
                                      {topic.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact Support */}
          <section className="text-center">
            <Card className="border rounded-xl border-border/60 shadow-xl bg-gradient-to-br from-primary/10 via-background/80 to-accent/5 dark:from-primary/20 dark:via-card/60 dark:to-accent/20 backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="py-12">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/10 dark:from-primary/30 dark:to-accent/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-primary/20 rounded-2xl blur-xl opacity-60" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Still need help?
                </h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
                  Can&apos;t find what you&apos;re looking for? Our support team is ready to help you succeed with RepliFast.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-105 group">
                    <Link href="mailto:support@replifast.com">
                      <span className="flex items-center justify-center gap-2">
                        Contact Support
                        <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      </span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-card/90 text-foreground border-border/60 font-medium hover:bg-card dark:hover:bg-muted/30 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm hover:scale-105">
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
