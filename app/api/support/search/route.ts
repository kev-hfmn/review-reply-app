import { NextRequest, NextResponse } from 'next/server';
import { helpTopics, faqItems } from '@/data/helpContent';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json({
      topics: [],
      faqs: [],
      total: 0
    });
  }

  // Search help topics
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
  }).map(topic => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    category: topic.category,
    icon: topic.icon,
    type: 'topic' as const
  }));

  // Search FAQs
  const matchedFAQs = faqItems.filter(faq => {
    const searchableText = [
      faq.question,
      faq.answer,
      ...faq.seoKeywords
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  }).map(faq => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    type: 'faq' as const
  }));

  // Combine and sort by relevance (title matches first, then description, etc.)
  const allResults = [
    ...matchedTopics.map(topic => ({
      ...topic,
      relevance: topic.title.toLowerCase().includes(query) ? 3 : 
                topic.description.toLowerCase().includes(query) ? 2 : 1
    })),
    ...matchedFAQs.map(faq => ({
      ...faq,
      relevance: faq.question.toLowerCase().includes(query) ? 3 : 1
    }))
  ].sort((a, b) => b.relevance - a.relevance);

  return NextResponse.json({
    topics: matchedTopics,
    faqs: matchedFAQs,
    total: allResults.length,
    query
  });
}