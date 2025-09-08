import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { getHelpTopic, getAllHelpSlugs, helpTopics } from '@/data/helpContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  generateArticleSchema,
  generateTopicHowToSchema,
  generateTopicFAQSchema
} from '@/lib/metadata/schema-generators';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getAllHelpSlugs().map((slug) => ({
    slug,
  }));
}

export { generateMetadata } from './metadata';

export default async function HelpTopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getHelpTopic(slug);

  if (!topic) {
    notFound();
  }

  const relatedTopics = topic.content.relatedTopics?.map(slug =>
    helpTopics.find(t => t.slug === slug)
  ).filter(Boolean) || [];

  const jsonLd = generateArticleSchema(topic);
  const howToJsonLd = generateTopicHowToSchema(topic);
  const faqJsonLd = generateTopicFAQSchema(topic);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="bg-background">
        {/* Breadcrumb Navigation */}
        <div className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/support"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Support</span>
              </Link>

              <nav className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/support" className="hover:text-foreground">Support</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{topic.title}</span>
              </nav>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Article Header */}
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {topic.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {topic.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {topic.content.overview}
            </p>
            <div className="flex items-center mt-6 text-sm text-muted-foreground">
              <span>Last updated: {new Date(topic.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Article Content */}
          <div className="space-y-8">
            {topic.content.sections.map((section, index) => (
              <Card key={index} className="border-0 shadow-sm bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-base">
                    {section.content}
                  </CardDescription>
                </CardHeader>

                {section.steps && (
                  <CardContent className="space-y-6">
                    {section.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground/80 rounded-full flex items-center justify-center text-sm font-semibold">
                          {stepIndex + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            {step.title}
                          </h4>
                          <p
                            className="text-muted-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: step.description }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Tips Section */}
            {topic.content.tips && topic.content.tips.length > 0 && (
              <Card className="border-0 shadow-sm bg-primary/10 dark:bg-primary/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    💡 Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {topic.content.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                        <span className="text-muted-foreground leading-relaxed">
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Related Topics */}
            {relatedTopics.length > 0 && (
              <Card className="border-0 shadow-sm bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">
                    Related Topics
                  </CardTitle>
                  <CardDescription>
                    Continue learning with these related help topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {relatedTopics.map((relatedTopic) => (
                      <Link
                        key={relatedTopic!.slug}
                        href={`/support/${relatedTopic!.slug}`}
                        className="block p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                      >
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {relatedTopic!.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {relatedTopic!.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer CTA */}
          <div className="mt-12 text-center">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 backdrop-blur-sm">
              <CardContent className="py-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Still need help?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to help you succeed with RepliFast.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/support"
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                  >
                    Browse All Topics
                  </Link>
                  <Link
                    href="mailto:support@replifast.com"
                    className="px-6 py-3 bg-card text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    Contact Support
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
