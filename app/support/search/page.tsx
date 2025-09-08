import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft, HelpCircle, BookOpen, MessageSquare, Brain, Palette, Link as LinkIcon } from 'lucide-react';
import { helpTopics, faqItems } from '@/data/helpContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const iconMap = {
  'HelpCircle': HelpCircle,
  'BookOpen': BookOpen,
  'MessageSquare': MessageSquare,
  'Brain': Brain,
  'Palette': Palette,
  'Link': LinkIcon,
};

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q;
  
  if (!query) {
    return {
      title: 'Search Support - RepliFast Help Center',
      description: 'Search RepliFast help documentation and FAQs'
    };
  }

  return {
    title: `Search results for "${query}" - RepliFast Support`,
    description: `Find help topics and FAQs related to "${query}" in RepliFast documentation`,
    robots: 'noindex,nofollow'
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.toLowerCase() || '';
  
  if (!query) {
    notFound();
  }

  // Server-side search logic (same as API route but executed on server)
  const matchedTopics = helpTopics.filter(topic => {
    const searchableText = [
      topic.title,
      topic.description,
      topic.content.overview,
      ...topic.seoKeywords,
      ...topic.content.sections.map(s => s.title + ' ' + s.content),
      ...(topic.content.tips || [])
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });

  const matchedFAQs = faqItems.filter(faq => {
    const searchableText = [
      faq.question,
      faq.answer,
      ...faq.seoKeywords
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });

  const totalResults = matchedTopics.length + matchedFAQs.length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/support"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Support</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Search Results
          </h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <form
              action="/support/search"
              method="GET"
              className="contents"
            >
              <Input
                type="text"
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search for help topics..."
                className="pl-12 pr-4 py-4 text-lg bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm border-white/20 dark:border-neutral-700/50 shadow-lg"
              />
              <button type="submit" className="sr-only">Search</button>
            </form>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} for &quot;{searchParams.q}&quot;
          </p>
        </div>

        {totalResults === 0 ? (
          // No results
          <Card className="border-0 shadow-sm bg-white/70 dark:bg-neutral-950/50 backdrop-blur-sm text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We couldn&apos;t find any help topics or FAQs matching your search.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/support"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Browse All Topics
                </Link>
                <Link 
                  href="mailto:support@replifast.com"
                  className="px-6 py-3 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Help Topics Results */}
            {matchedTopics.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Help Topics ({matchedTopics.length})
                </h2>
                <div className="grid gap-4">
                  {matchedTopics.map((topic) => {
                    const IconComponent = iconMap[topic.icon as keyof typeof iconMap] || HelpCircle;
                    
                    return (
                      <Link key={topic.id} href={`/support/${topic.slug}`}>
                        <Card className="border-0 shadow-sm bg-white/70 dark:bg-neutral-950/50 backdrop-blur-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {topic.title}
                                  </CardTitle>
                                  <Badge variant="outline" className="text-xs">
                                    {topic.category.replace('-', ' ')}
                                  </Badge>
                                </div>
                                <CardDescription className="text-base">
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
              </section>
            )}

            {/* FAQ Results */}
            {matchedFAQs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Frequently Asked Questions ({matchedFAQs.length})
                </h2>
                <div className="space-y-4">
                  {matchedFAQs.map((faq) => (
                    <Card key={faq.id} className="border-0 shadow-sm bg-white/70 dark:bg-neutral-950/50 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg text-slate-900 dark:text-white">
                            {faq.question}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                          {faq.answer}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Still need help?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/support"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Browse All Topics
                </Link>
                <Link 
                  href="mailto:support@replifast.com"
                  className="px-6 py-3 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}