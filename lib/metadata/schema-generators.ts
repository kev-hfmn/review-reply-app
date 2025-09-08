import { helpTopics, faqItems } from '@/data/helpContent';

export function generateFAQSchema(faqs: typeof faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": "RepliFast AI Review Management FAQ",
    "description": "Frequently asked questions about RepliFast AI-powered review management platform for small businesses",
    "url": "/support",
    "inLanguage": "en-US",
    "dateModified": new Date().toISOString(),
    "publisher": {
      "@type": "Organization",
      "name": "RepliFast",
      "url": "/",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png"
      }
    },
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
        "dateCreated": new Date().toISOString(),
        "upvoteCount": 0,
        "author": {
          "@type": "Organization",
          "name": "RepliFast Support Team"
        }
      }
    }))
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "RepliFast",
    "description": "AI-powered review management platform for small businesses",
    "url": "/",
    "inLanguage": "en-US",
    "publisher": {
      "@type": "Organization",
      "name": "RepliFast",
      "url": "/",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "/support/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateHowToSchema(topics: typeof helpTopics) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "RepliFast Help Topics",
    "description": "Comprehensive guides for using RepliFast AI review management platform",
    "numberOfItems": topics.length,
    "itemListElement": topics.map((topic, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "HowTo",
        "name": topic.title,
        "description": topic.description,
        "url": `/support/${topic.slug}`,
        "image": `/help-topics/${topic.slug}.png`,
        "totalTime": "PT10M",
        "supply": [],
        "tool": [],
        "step": topic.content.sections.map((section, stepIndex) => ({
          "@type": "HowToStep",
          "position": stepIndex + 1,
          "name": section.title,
          "text": section.content,
          "url": `/support/${topic.slug}#step-${stepIndex + 1}`
        }))
      }
    }))
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RepliFast",
    "url": "/",
    "logo": "/logo.png",
    "description": "AI-powered review management platform helping small businesses automate and optimize their customer review responses",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-REPLI-FAST",
      "contactType": "Customer Support",
      "email": "support@replifast.com",
      "availableLanguage": ["English"],
      "areaServed": "Worldwide"
    },
    "sameAs": [
      "https://twitter.com/replifast",
      "https://linkedin.com/company/replifast"
    ]
  };
}

export function generateBreadcrumbSchema(items: Array<{name: string, item: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item
    }))
  };
}

// Individual topic schema generators
export function generateArticleSchema(topic: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": topic.title,
    "description": topic.metaDescription,
    "image": `/help-topics/${topic.slug}-og.png`,
    "datePublished": topic.lastUpdated,
    "dateModified": topic.lastUpdated,
    "author": {
      "@type": "Organization",
      "name": "RepliFast Support Team",
      "url": "/support"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "RepliFast",
      "url": "/",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png",
        "width": 200,
        "height": 200
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `/support/${topic.slug}`
    },
    "articleSection": topic.category.replace('-', ' '),
    "keywords": topic.seoKeywords.join(', '),
    "wordCount": topic.content.sections.reduce((acc: number, section: any) => 
      acc + section.content.split(' ').length + 
      (section.steps?.reduce((stepAcc: number, step: any) => 
        stepAcc + step.description.split(' ').length, 0) || 0), 0),
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "breadcrumb": generateBreadcrumbSchema([
      { name: "Home", item: "/" },
      { name: "Support", item: "/support" },
      { name: topic.title, item: `/support/${topic.slug}` }
    ])
  };
}

export function generateTopicHowToSchema(topic: any) {
  const hasSteps = topic.content.sections.some((section: any) => section.steps);
  
  if (!hasSteps) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": topic.title,
    "description": topic.metaDescription,
    "image": `/help-topics/${topic.slug}-og.png`,
    "totalTime": "PT15M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "supply": [],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "RepliFast Account"
      },
      {
        "@type": "HowToTool", 
        "name": "Google Business Profile"
      }
    ],
    "step": topic.content.sections.flatMap((section: any, sectionIndex: number) => 
      section.steps?.map((step: any, stepIndex: number) => ({
        "@type": "HowToStep",
        "position": stepIndex + 1,
        "name": step.title,
        "text": step.description.replace(/<[^>]*>/g, ''), // Remove HTML tags
        "url": `/support/${topic.slug}#step-${sectionIndex}-${stepIndex}`,
        "image": `/help-topics/${topic.slug}-step-${stepIndex + 1}.png`
      })) || []
    )
  };
}

export function generateTopicFAQSchema(topic: any) {
  if (!topic.content.tips || topic.content.tips.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": topic.content.tips.map((tip: string, index: number) => ({
      "@type": "Question",
      "name": `Tip ${index + 1} for ${topic.title}`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": tip
      }
    }))
  };
}
