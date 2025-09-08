'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, HelpCircle, BookOpen, MessageSquare, Brain, Palette, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { helpTopics, faqItems } from '@/data/helpContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const iconMap = {
  'HelpCircle': HelpCircle,
  'BookOpen': BookOpen,
  'MessageSquare': MessageSquare,
  'Brain': Brain,
  'Palette': Palette,
  'Link': LinkIcon,
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter topics based on search
  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.seoKeywords.some(keyword =>
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filter FAQs based on search
  const filteredFAQs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Help & Support
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Find answers and get help with RepliFast
          </p>
        </div>
        <Link
          href="/support"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Visit Full Help Center
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-white dark:bg-neutral-dark border border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search help topics and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 "
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Topics */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Quick Help Topics
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.slice(0, 6).map((topic) => {
            const IconComponent = iconMap[topic.icon as keyof typeof iconMap] || HelpCircle;

            return (
              <Dialog key={topic.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {topic.category.replace('-', ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{topic.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {topic.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </DialogTrigger>

                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      {topic.title}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {topic.content.overview}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-6">
                    {topic.content.sections.map((section, index) => (
                      <div key={index} className="space-y-4">
                        <h4 className="text-lg font-semibold text-foreground">
                          {section.title}
                        </h4>
                        <p className="text-muted-foreground">
                          {section.content}
                        </p>

                        {section.steps && (
                          <div className="space-y-3">
                            {section.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                                  {stepIndex + 1}
                                </div>
                                <div>
                                  <h5 className="font-medium text-foreground">
                                    {step.title}
                                  </h5>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {topic.content.tips && topic.content.tips.length > 0 && (
                      <div className="bg-primary/10 rounded-lg p-4">
                        <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                          💡 Pro Tips
                        </h4>
                        <ul className="space-y-2">
                          {topic.content.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-primary/80 dark:text-primary-foreground/70 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <Link
                        href={`/support/${topic.slug}`}
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        View full article
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(topic.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Frequently Asked Questions
        </h2>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Accordion type="multiple" className="w-full">
              {filteredFAQs.slice(0, 8).map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-border">
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {faq.question}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {filteredFAQs.length > 8 && (
          <div className="text-center mt-4">
            <Link
              href="/support"
              className="text-primary hover:underline text-sm"
            >
              View all {filteredFAQs.length} FAQs
            </Link>
          </div>
        )}
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Still need help?
          </h3>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you succeed with RepliFast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="mailto:support@replifast.com"
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/support"
              className="px-6 py-2 bg-card text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Browse Help Center
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
