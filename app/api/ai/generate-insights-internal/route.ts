import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function POST(request: Request) {
  try {
    const { systemPrompt, userPrompt, reviews, businessInfo } = await request.json();
    
    // Validate required fields
    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing system or user prompt' },
        { status: 400 }
      );
    }

    // Basic rate limiting (in production, implement proper rate limiting)
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Log the analysis request for debugging (in production, use proper logging)
    console.log(`\n===== INSIGHTS ANALYSIS REQUEST =====`);
    console.log(`Reviews: ${reviews || 0}`);
    console.log(`Business: ${businessInfo || 'Unknown'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Call OpenAI API with optimal parameters for business analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for consistent business analysis
      max_tokens: 2500, // Higher limit for comprehensive insights
      response_format: { type: "json_object" }, // Ensure JSON response
      n: 1,
    });
    
    // Extract and validate response
    const rawResponse = completion.choices[0]?.message?.content?.trim();
    
    if (!rawResponse) {
      throw new Error('No insights generated');
    }

    // Parse and validate JSON response
    let parsedInsights;
    try {
      parsedInsights = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', rawResponse);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the structure of parsed insights
    const validatedInsights = validateInsightsStructure(parsedInsights);
    
    // Calculate usage and cost for monitoring
    const usage = completion.usage;
    const estimatedCost = calculateCost(usage);

    // Log successful completion
    console.log(`\n===== INSIGHTS GENERATED =====`);
    console.log(`Positive themes: ${validatedInsights.positiveThemes?.length || 0}`);
    console.log(`Improvement themes: ${validatedInsights.improvementThemes?.length || 0}`);
    console.log(`Highlights: ${validatedInsights.highlights?.length || 0}`);
    console.log(`Overall confidence: ${validatedInsights.overallConfidence || 'N/A'}`);
    console.log(`Tokens used: ${usage?.total_tokens || 'N/A'}`);
    console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
    
    // Return the validated insights with metadata
    return NextResponse.json({
      ...validatedInsights,
      _metadata: {
        tokensUsed: usage?.total_tokens || 0,
        estimatedCost,
        processingTime: Date.now(),
        model: 'gpt-4o-mini',
        confidence: validatedInsights.overallConfidence || 0.85
      }
    });
    
  } catch (error: unknown) {
    console.error('AI insights generation error:', error);
    
    // Return structured error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate insights';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        fallback: true,
        message: 'AI analysis temporarily unavailable. Please try again.'
      },
      { status: 500 }
    );
  }
}

/**
 * Simple rate limiting check
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  // Increment count
  clientData.count++;
  return true;
}

/**
 * Validate and sanitize insights structure
 */
function validateInsightsStructure(insights: any): any {
  const validated = {
    positiveThemes: [],
    improvementThemes: [],
    highlights: [],
    competitiveInsights: {
      competitorMentions: [],
      uniqueValueProps: [],
      marketPositioning: {
        pricePerception: 'value',
        qualityPosition: 'standard',
        serviceLevel: 'good'
      }
    },
    overallConfidence: 0.85
  };

  // Validate positive themes
  if (Array.isArray(insights.positiveThemes)) {
    validated.positiveThemes = insights.positiveThemes
      .filter(theme => theme && typeof theme === 'object')
      .map(theme => validateTheme(theme, 'positive'))
      .filter(Boolean)
      .slice(0, 5); // Limit to 5 themes
  }

  // Validate improvement themes
  if (Array.isArray(insights.improvementThemes)) {
    validated.improvementThemes = insights.improvementThemes
      .filter(theme => theme && typeof theme === 'object')
      .map(theme => validateTheme(theme, 'improvement'))
      .filter(Boolean)
      .slice(0, 4); // Limit to 4 themes
  }

  // Validate highlights
  if (Array.isArray(insights.highlights)) {
    validated.highlights = insights.highlights
      .filter(highlight => highlight && typeof highlight === 'object')
      .map(validateHighlight)
      .filter(Boolean)
      .slice(0, 6); // Limit to 6 highlights
  }

  // Validate competitive insights
  if (insights.competitiveInsights && typeof insights.competitiveInsights === 'object') {
    const competitive = insights.competitiveInsights;
    
    if (Array.isArray(competitive.uniqueValueProps)) {
      validated.competitiveInsights.uniqueValueProps = competitive.uniqueValueProps
        .filter(prop => typeof prop === 'string' && prop.length > 0)
        .slice(0, 5);
    }

    if (competitive.marketPositioning && typeof competitive.marketPositioning === 'object') {
      const positioning = competitive.marketPositioning;
      validated.competitiveInsights.marketPositioning = {
        pricePerception: validateEnum(positioning.pricePerception, ['premium', 'value', 'budget'], 'value'),
        qualityPosition: validateEnum(positioning.qualityPosition, ['luxury', 'standard', 'basic'], 'standard'),
        serviceLevel: validateEnum(positioning.serviceLevel, ['exceptional', 'good', 'average'], 'good')
      };
    }
  }

  // Validate overall confidence
  if (typeof insights.overallConfidence === 'number' && 
      insights.overallConfidence >= 0 && insights.overallConfidence <= 1) {
    validated.overallConfidence = insights.overallConfidence;
  }

  return validated;
}

/**
 * Validate individual theme structure
 */
function validateTheme(theme: any, type: 'positive' | 'improvement'): any {
  if (!theme || typeof theme !== 'object') return null;

  const validated = {
    theme: sanitizeString(theme.theme) || `${type} theme`,
    specificExample: sanitizeString(theme.specificExample) || 'No example provided',
    impactAssessment: sanitizeString(theme.impactAssessment) || 'Impact assessment pending',
    recommendedAction: sanitizeString(theme.recommendedAction) || 'Action recommendation needed',
    priority: validateEnum(theme.priority, ['critical', 'high', 'medium', 'low'], 'medium'),
    affectedCustomerCount: validateNumber(theme.affectedCustomerCount, 1, 100, 1),
    implementationComplexity: validateEnum(theme.implementationComplexity, ['simple', 'moderate', 'complex'], 'moderate'),
    potentialROI: sanitizeString(theme.potentialROI) || 'ROI assessment pending',
    confidence: validateNumber(theme.confidence, 0, 1, 0.7)
  };

  return validated;
}

/**
 * Validate highlight structure
 */
function validateHighlight(highlight: any): any {
  if (!highlight || typeof highlight !== 'object') return null;

  const validated = {
    id: sanitizeString(highlight.id) || crypto.randomUUID(),
    customer_name: sanitizeString(highlight.customer_name) || 'Anonymous Customer',
    rating: validateNumber(highlight.rating, 1, 5, 3),
    review_text: sanitizeString(highlight.review_text) || 'Review text not available',
    type: validateEnum(highlight.type, ['best', 'worst', 'notable'], 'notable'),
    businessValue: sanitizeString(highlight.businessValue) || 'Business value assessment needed',
    actionImplication: sanitizeString(highlight.actionImplication) || 'Action needed',
    representativeness: validateNumber(highlight.representativeness, 0, 1, 0.5)
  };

  return validated;
}

/**
 * Sanitize string inputs
 */
function sanitizeString(value: any): string | null {
  if (typeof value !== 'string') return null;
  
  const sanitized = value.trim().slice(0, 500); // Limit length
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate enum values
 */
function validateEnum(value: any, allowedValues: string[], defaultValue: string): string {
  if (typeof value === 'string' && allowedValues.includes(value)) {
    return value;
  }
  return defaultValue;
}

/**
 * Validate numeric values
 */
function validateNumber(value: any, min: number, max: number, defaultValue: number): number {
  if (typeof value === 'number' && value >= min && value <= max && !isNaN(value)) {
    return value;
  }
  return defaultValue;
}

/**
 * Calculate estimated cost based on token usage
 */
function calculateCost(usage: any): number {
  if (!usage) return 0;
  
  // GPT-4o-mini pricing (as of 2024)
  const inputCostPer1K = 0.00015;   // $0.15 per 1K input tokens
  const outputCostPer1K = 0.0006;   // $0.60 per 1K output tokens
  
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  
  return inputCost + outputCost;
}