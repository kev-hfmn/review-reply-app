import type { Metadata } from "next";
import { getHelpTopic } from '@/data/helpContent';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  
  if (!topic) {
    return {
      title: 'Help Topic Not Found - RepliFast Support',
      description: 'The requested help topic could not be found.',
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const publishedDate = new Date(topic.lastUpdated);
  const modifiedDate = new Date(topic.lastUpdated);

  return {
    title: topic.metaTitle,
    description: topic.metaDescription,
    keywords: topic.seoKeywords.join(', '),
    authors: [{ name: 'RepliFast Support Team' }],
    creator: 'RepliFast',
    publisher: 'RepliFast',
    category: 'Help Documentation',
    classification: topic.category.replace('-', ' '),
    openGraph: {
      title: topic.metaTitle,
      description: topic.metaDescription,
      type: 'article',
      url: `https://www.replifast.com/support/${topic.slug}`,
      siteName: 'RepliFast',
      locale: 'en_US',
      publishedTime: publishedDate.toISOString(),
      modifiedTime: modifiedDate.toISOString(),
      section: topic.category.replace('-', ' '),
      tags: topic.seoKeywords,
      images: [
        {
          url: `/help-topics/${topic.slug}-og.png`,
          width: 1200,
          height: 630,
          alt: `${topic.title} - RepliFast Help Guide`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: topic.metaTitle,
      description: topic.metaDescription,
      creator: '@replifast',
      images: [`/help-topics/${topic.slug}-og.png`]
    },
    alternates: {
      canonical: `https://www.replifast.com/support/${topic.slug}`
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:published_time': publishedDate.toISOString(),
      'article:modified_time': modifiedDate.toISOString(),
      'article:section': topic.category.replace('-', ' '),
      'article:tag': topic.seoKeywords.join(',')
    }
  };
}
