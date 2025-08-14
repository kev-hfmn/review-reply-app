import { supabaseAdmin } from '@/utils/supabase-admin';

// Use admin client for all database operations
const supabase = supabaseAdmin;

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface Review {
  id: string;
  business_id: string;
  google_review_id: string | null;
  customer_name: string;
  customer_avatar_url: string | null;
  rating: number;
  review_text: string;
  review_date: string;
  status: string;
  ai_reply?: string | null;
  final_reply?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
}

export interface ContentAnalysis {
  sentimentScore: number;           // -1.0 to 1.0
  emotionalTone: string[];          // ['frustrated', 'delighted', 'concerned']
  topicCategories: string[];        // ['service_speed', 'product_quality', 'staff']
  urgencyLevel: 'low' | 'medium' | 'high';
  specificityScore: number;         // How actionable vs generic (0-1)
}

export interface BusinessImpact {
  revenueImplication: 'positive' | 'neutral' | 'negative';
  operationalComplexity: 'low' | 'medium' | 'high';
  implementationEffort: 'quick-win' | 'medium-term' | 'strategic';
  customerImpactScope: 'individual' | 'segment' | 'all-customers';
  competitiveAdvantage: boolean;
}

export interface ActionableTheme {
  theme: string;                    // "Checkout wait times during peak hours"
  specificExample: string;          // Direct customer quote as evidence
  impactAssessment: string;         // Business impact explanation
  recommendedAction: string;        // Concrete next step
  priority: 'critical' | 'high' | 'medium' | 'low';
  affectedCustomerCount: number;    // How many customers mentioned this
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  potentialROI: string;            // Estimated business impact
  confidence: number;              // AI confidence score (0-1)
}

export interface ReviewHighlight {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  type: 'best' | 'worst' | 'notable';
  businessValue: string;           // Why this review matters for business
  actionImplication: string;       // What the business should do about it
  representativeness: number;      // How many other customers feel similarly (0-1)
}

export interface DigestStats {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  weekOverWeekChange: number;
  uniqueCustomers: number;
  satisfactionDrivers: Array<{
    factor: string;
    impactScore: number;
    mentionFrequency: number;
  }>;
  ratingBreakdown?: Record<string, number>; // Add rating breakdown to interface
}

export interface WeeklyDigestInsights {
  id: string;
  business_id: string;
  week_start: string;
  week_end: string;
  stats: DigestStats;
  positiveThemes: ActionableTheme[];
  improvementThemes: ActionableTheme[];
  highlights: ReviewHighlight[];
  competitiveInsights: {
    competitorMentions: Array<{
      competitor: string;
      context: 'positive' | 'negative' | 'neutral';
      quote: string;
      implication: string;
    }>;
    uniqueValueProps: string[];
    marketPositioning: {
      pricePerception: 'premium' | 'value' | 'budget';
      qualityPosition: 'luxury' | 'standard' | 'basic';
      serviceLevel: 'exceptional' | 'good' | 'average';
    };
  };
  overallConfidence: number;       // Average confidence of all insights
  generated_at: string;
  created_at: string;
}

export interface CachedDigest {
  id: string;
  business_id: string;
  week_start: string;
  week_end: string;
  total_reviews: number;
  rating_breakdown: Record<string, number> & {
    averageRating?: number;
    responseRate?: number;
    uniqueCustomers?: number;
  };
  positive_themes: string[];
  improvement_themes: string[];
  highlights: unknown[];
  generated_at: string;
  created_at: string;
}

// ==========================================
// AI PROMPTING CONSTANTS
// ==========================================

const BUSINESS_INTELLIGENCE_SYSTEM_PROMPT = `You are a senior business consultant specializing in customer experience optimization and competitive analysis.

Your task: Analyze customer reviews to extract SPECIFIC, ACTIONABLE business intelligence that drives measurable outcomes.

ANALYSIS FRAMEWORK:
1. OPERATIONAL INSIGHTS: Specific process improvements (not "improve service" but "reduce checkout time from 5min to 2min")
2. COMPETITIVE SIGNALS: What customers compare against, unique advantages mentioned
3. REVENUE OPPORTUNITIES: Pricing perception, upsell signals, retention risks
4. CUSTOMER SEGMENTATION: Different persona needs and satisfaction drivers

OUTPUT REQUIREMENTS:
- Every insight must suggest a specific action
- Rank by Impact Potential × Implementation Feasibility
- Include customer quote as evidence
- Estimate affected customer percentage
- Identify quick wins vs strategic initiatives

AVOID: Generic advice, vague recommendations, insights without clear next steps.
FOCUS ON: Measurable improvements, competitive advantages, operational efficiency, customer lifetime value optimization.

You must respond with valid JSON only. No additional text or explanations.`;

// ==========================================
// MAIN SERVICE CLASS
// ==========================================

export class DigestInsightsService {
  
  /**
   * Generate weekly insights for a business
   */
  async generateWeeklyInsights(
    businessId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklyDigestInsights> {
    try {
      // Check for cached insights first (unless force regenerate is requested)
      const cached = await this.getCachedInsights(businessId, weekStart);
      if (cached && !this.isStale(cached)) {
        console.log('Using cached insights');
        return this.transformCachedToInsights(cached);
      }

      console.log('=== GENERATING FRESH INSIGHTS ===');

      // Fetch reviews for the specified week
      const reviews = await this.fetchReviewsForWeek(businessId, weekStart, weekEnd);
      
      if (reviews.length === 0) {
        console.log('No reviews found for the specified week');
        return this.generateEmptyInsights(businessId, weekStart, weekEnd);
      }

      // Fetch business information
      const businessInfo = await this.fetchBusinessInfo(businessId);
      if (!businessInfo) {
        throw new Error('Business not found');
      }

      console.log(`Processing ${reviews.length} reviews for ${businessInfo.name}`);

      // Perform AI analysis
      const insights = await this.performMultiPassAnalysis(reviews, businessInfo, weekStart, weekEnd);
      
      // Cache the results
      await this.cacheInsights(insights);
      
      return insights;

    } catch (error) {
      console.error('Error generating weekly insights:', error);
      
      // Return fallback insights on error
      const businessInfo = await this.fetchBusinessInfo(businessId);
      const reviews = await this.fetchReviewsForWeek(businessId, weekStart, weekEnd);
      
      return this.generateFallbackInsights(
        reviews || [], 
        businessInfo || { id: businessId, name: 'Unknown Business', industry: null, location: null }, 
        weekStart, 
        weekEnd
      );
    }
  }

  /**
   * Fetch reviews for a specific week range
   */
  private async fetchReviewsForWeek(
    businessId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<Review[]> {
    // Format dates to ensure proper comparison (remove time component for date-only fields)
    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];
    
    console.log(`Fetching reviews for business ${businessId} from ${startDateStr} to ${endDateStr}`);
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .gte('review_date', startDateStr)
      .lt('review_date', endDateStr)
      .order('review_date', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }

    console.log(`Found ${data?.length || 0} reviews for the period`);
    
    // Also try fetching with created_at if review_date filtering returns no results
    if (!data || data.length === 0) {
      console.log('No reviews found with review_date, trying created_at...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: false });
        
      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        console.log(`Found ${fallbackData.length} reviews using created_at instead`);
        return fallbackData;
      }
    }

    return data || [];
  }

  /**
   * Fetch business information
   */
  private async fetchBusinessInfo(businessId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, industry, location')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('Error fetching business info:', error);
      return null;
    }

    return data;
  }

  /**
   * Check for cached insights
   */
  private async getCachedInsights(
    businessId: string, 
    weekStart: Date
  ): Promise<CachedDigest | null> {
    const { data, error } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('business_id', businessId)
      .eq('week_start', this.formatDate(weekStart))
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Check if cached insights are stale (older than 24 hours)
   */
  private isStale(cached: CachedDigest): boolean {
    const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return cacheAge > staleThreshold;
  }

  /**
   * Perform multi-pass AI analysis on reviews
   */
  private async performMultiPassAnalysis(
    reviews: Review[],
    businessInfo: Business,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyDigestInsights> {
    // Generate the user prompt with review data
    const userPrompt = this.generateInsightsPrompt(reviews, businessInfo);

    try {
      // Import OpenAI dynamically to avoid issues
      const OpenAI = (await import('openai')).default;
      
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      console.log(`\n===== INSIGHTS ANALYSIS REQUEST =====`);
      console.log(`Reviews: ${reviews.length}`);
      console.log(`Business: ${businessInfo.name}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      
      // Call OpenAI API directly
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: BUSINESS_INTELLIGENCE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for consistent business analysis
        max_tokens: 2500, // Higher limit for comprehensive insights
        response_format: { type: "json_object" }, // Ensure JSON response
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      const aiResults = JSON.parse(aiResponse);
      console.log('AI analysis completed successfully');
      console.log('AI Results sample:', JSON.stringify(aiResults, null, 2).substring(0, 500) + '...');
      
      // Process AI results into structured insights
      return this.processAIResults(aiResults, reviews, businessInfo, weekStart, weekEnd);

    } catch (error) {
      console.error('AI analysis error:', error);
      // Return fallback insights if AI fails
      return this.generateFallbackInsights(reviews, businessInfo, weekStart, weekEnd);
    }
  }

  /**
   * Generate the user prompt for AI analysis
   */
  private generateInsightsPrompt(reviews: Review[], businessInfo: Business): string {
    const dateRange = this.getDateRange(reviews);
    
    return `BUSINESS CONTEXT:
- Business: ${businessInfo.name}
- Industry: ${businessInfo.industry || 'service'}
- Location: ${businessInfo.location || 'not specified'}
- Total Reviews: ${reviews.length}
- Date Range: ${dateRange}

REVIEW DATA:
${reviews.map(r => `
Rating: ${r.rating}/5
Date: ${new Date(r.review_date).toLocaleDateString()}
Customer: ${r.customer_name}
Review: "${r.review_text}"
---`).join('\n')}

ANALYSIS REQUEST:
Generate a comprehensive business intelligence analysis with the following structure:

{
  "positiveThemes": [
    {
      "theme": "specific positive pattern",
      "specificExample": "direct customer quote",
      "impactAssessment": "business impact explanation",
      "recommendedAction": "concrete next step",
      "priority": "high|medium|low",
      "affectedCustomerCount": number,
      "implementationComplexity": "simple|moderate|complex",
      "potentialROI": "estimated business impact",
      "confidence": 0.0-1.0
    }
  ],
  "improvementThemes": [
    {
      "theme": "specific improvement opportunity",
      "specificExample": "direct customer quote",
      "impactAssessment": "business impact explanation", 
      "recommendedAction": "concrete next step",
      "priority": "critical|high|medium|low",
      "affectedCustomerCount": number,
      "implementationComplexity": "simple|moderate|complex",
      "potentialROI": "estimated business impact",
      "confidence": 0.0-1.0
    }
  ],
  "highlights": [
    {
      "id": "review_id",
      "customer_name": "customer name",
      "rating": rating,
      "review_text": "full review text",
      "type": "best|worst|notable",
      "businessValue": "why this matters for business",
      "actionImplication": "what to do about it",
      "representativeness": 0.0-1.0
    }
  ],
  "competitiveInsights": {
    "uniqueValueProps": ["specific advantages mentioned"],
    "marketPositioning": {
      "pricePerception": "premium|value|budget",
      "qualityPosition": "luxury|standard|basic", 
      "serviceLevel": "exceptional|good|average"
    }
  },
  "overallConfidence": 0.0-1.0
}

Focus on actionable insights that drive measurable business outcomes.`;
  }

  /**
   * Process AI results into structured insights
   */
  private processAIResults(
    aiResults: Record<string, unknown>,
    reviews: Review[],
    businessInfo: Business,
    weekStart: Date,
    weekEnd: Date
  ): WeeklyDigestInsights {
    // Calculate basic stats
    const stats = this.calculateDigestStats(reviews);

    // Validate and clean AI themes
    const cleanPositiveThemes = this.validateAndCleanThemes(Array.isArray(aiResults.positiveThemes) ? aiResults.positiveThemes : [], reviews.length);
    const cleanImprovementThemes = this.validateAndCleanThemes(Array.isArray(aiResults.improvementThemes) ? aiResults.improvementThemes : [], reviews.length);

    return {
      id: crypto.randomUUID(),
      business_id: businessInfo.id,
      week_start: this.formatDate(weekStart),
      week_end: this.formatDate(weekEnd),
      stats,
      positiveThemes: cleanPositiveThemes,
      improvementThemes: cleanImprovementThemes,
      highlights: Array.isArray(aiResults.highlights) ? aiResults.highlights : [],
      competitiveInsights: ((typeof aiResults.competitiveInsights === 'object' && aiResults.competitiveInsights) ? aiResults.competitiveInsights : {
        competitorMentions: [],
        uniqueValueProps: [],
        marketPositioning: {
          pricePerception: 'value',
          qualityPosition: 'standard',
          serviceLevel: 'good'
        }
      }) as unknown as Record<string, unknown>,
      overallConfidence: (typeof aiResults.overallConfidence === 'number' ? aiResults.overallConfidence : 0.85),
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Validate and clean AI-generated themes
   */
  private validateAndCleanThemes(themes: unknown[], totalReviews: number): ActionableTheme[] {
    if (!Array.isArray(themes)) return [];

    // Deduplicate themes by similar content
    const uniqueThemes = new Map<string, Record<string, unknown>>();
    
    themes.forEach(theme => {
      if (!theme || typeof theme !== 'object') return;
      
      const themeKey = theme.theme?.toLowerCase().trim();
      if (!themeKey) return;
      
      // If we already have a similar theme, merge the customer counts
      if (uniqueThemes.has(themeKey)) {
        const existing = uniqueThemes.get(themeKey);
        existing.affectedCustomerCount = Math.min(
          existing.affectedCustomerCount + (theme.affectedCustomerCount || 1),
          totalReviews
        );
      } else {
        uniqueThemes.set(themeKey, { ...theme });
      }
    });

    // Convert back to array and validate each theme
    return Array.from(uniqueThemes.values()).map(theme => ({
      theme: theme.theme || 'Unknown theme',
      specificExample: theme.specificExample || 'No example provided',
      impactAssessment: theme.impactAssessment || 'Impact assessment pending',
      recommendedAction: theme.recommendedAction || 'Action recommendation pending',
      priority: ['critical', 'high', 'medium', 'low'].includes(theme.priority) ? theme.priority : 'medium',
      affectedCustomerCount: Math.min(Math.max(theme.affectedCustomerCount || 1, 1), totalReviews),
      implementationComplexity: ['simple', 'moderate', 'complex'].includes(theme.implementationComplexity) ? theme.implementationComplexity : 'moderate',
      potentialROI: theme.potentialROI || 'ROI assessment pending',
      confidence: Math.min(Math.max(theme.confidence || 0.8, 0), 1)
    })).slice(0, 5); // Limit to 5 themes max
  }

  /**
   * Calculate digest statistics from reviews
   */
  private calculateDigestStats(reviews: Review[]): DigestStats {
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        responseRate: 0,
        weekOverWeekChange: 0,
        uniqueCustomers: 0,
        satisfactionDrivers: []
      };
    }

    const totalReviews = reviews.length;
    
    // Debug logging for rating calculation
    console.log(`\n===== RATING CALCULATION DEBUG =====`);
    console.log(`Total reviews: ${totalReviews}`);
    console.log(`Sample review ratings:`, reviews.slice(0, 5).map(r => ({ name: r.customer_name, rating: r.rating, type: typeof r.rating })));
    
    const ratingSum = reviews.reduce((sum, r) => {
      const rating = Number(r.rating);
      if (isNaN(rating)) {
        console.log(`Invalid rating for ${r.customer_name}: ${r.rating} (${typeof r.rating})`);
        return sum;
      }
      return sum + rating;
    }, 0);
    
    const averageRating = ratingSum / totalReviews;
    console.log(`Rating sum: ${ratingSum}, Average: ${averageRating}`);
    
    const uniqueCustomers = new Set(reviews.map(r => r.customer_name)).size;
  
  // Calculate actual rating breakdown from review data
  console.log(`\n===== RATING BREAKDOWN CALCULATION DEBUG =====`);
  const ratingBreakdown: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  
  reviews.forEach(r => {
    const rating = Number(r.rating);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      ratingBreakdown[rating.toString()]++;
      console.log(`Added rating ${rating} for ${r.customer_name}`);
    }
  });
  
  console.log(`Rating breakdown:`, ratingBreakdown);
  
  // Calculate response rate (reviews with replies)
  console.log(`\n===== RESPONSE RATE CALCULATION DEBUG =====`);
  const reviewsWithReplies = reviews.filter(r => {
    const hasReply = !!(r.ai_reply || r.final_reply);
    if (hasReply) {
      console.log(`Review by ${r.customer_name} has reply: ai_reply=${!!r.ai_reply}, final_reply=${!!r.final_reply}`);
    }
    return hasReply;
  });
  console.log(`Reviews with replies: ${reviewsWithReplies.length} out of ${totalReviews}`);
  const responseRate = totalReviews > 0 ? (reviewsWithReplies.length / totalReviews) * 100 : 0;
  console.log(`Response rate: ${responseRate}%`);
  console.log(`=======================================\n`);

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      responseRate: Math.round(responseRate),
      weekOverWeekChange: 0, // TODO: Calculate from previous week data
      uniqueCustomers,
      satisfactionDrivers: [], // TODO: Extract from review analysis
      ratingBreakdown // Add the actual rating breakdown to stats
    };
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(
    reviews: Review[],
    businessInfo: Business,
    weekStart: Date,
    weekEnd: Date
  ): WeeklyDigestInsights {
    const stats = this.calculateDigestStats(reviews);

    // Basic fallback themes
    const positiveThemes: ActionableTheme[] = reviews
      .filter(r => r.rating >= 4)
      .slice(0, 3)
      .map(r => ({
        theme: `Positive customer experience - ${r.rating} stars`,
        specificExample: r.review_text.substring(0, 100) + '...',
        impactAssessment: 'Customer satisfaction indicator',
        recommendedAction: 'Continue current practices that generate positive feedback',
        priority: 'medium' as const,
        affectedCustomerCount: 1,
        implementationComplexity: 'simple' as const,
        potentialROI: 'Maintain customer loyalty',
        confidence: 0.7
      }));

    const improvementThemes: ActionableTheme[] = reviews
      .filter(r => r.rating <= 3)
      .slice(0, 2)
      .map(r => ({
        theme: `Customer concern - ${r.rating} star rating`,
        specificExample: r.review_text.substring(0, 100) + '...',
        impactAssessment: 'Potential customer satisfaction issue',
        recommendedAction: 'Review and address specific customer concern',
        priority: r.rating <= 2 ? 'high' as const : 'medium' as const,
        affectedCustomerCount: 1,
        implementationComplexity: 'moderate' as const,
        potentialROI: 'Improve customer satisfaction',
        confidence: 0.6
      }));

    const highlights: ReviewHighlight[] = [
      ...reviews.filter(r => r.rating === 5).slice(0, 1).map(r => ({
        id: r.id,
        customer_name: r.customer_name,
        rating: r.rating,
        review_text: r.review_text,
        type: 'best' as const,
        businessValue: 'Showcases excellent customer experience',
        actionImplication: 'Use as testimonial and replicate successful practices',
        representativeness: 0.3
      })),
      ...reviews.filter(r => r.rating <= 2).slice(0, 1).map(r => ({
        id: r.id,
        customer_name: r.customer_name,
        rating: r.rating,
        review_text: r.review_text,
        type: 'worst' as const,
        businessValue: 'Identifies improvement opportunity',
        actionImplication: 'Address specific issues mentioned in review',
        representativeness: 0.2
      }))
    ];

    return {
      id: crypto.randomUUID(),
      business_id: businessInfo.id,
      week_start: this.formatDate(weekStart),
      week_end: this.formatDate(weekEnd),
      stats,
      positiveThemes,
      improvementThemes,
      highlights,
      competitiveInsights: {
        competitorMentions: [],
        uniqueValueProps: ['Quality service delivery'],
        marketPositioning: {
          pricePerception: 'value',
          qualityPosition: 'standard',
          serviceLevel: 'good'
        }
      },
      overallConfidence: 0.65,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Generate empty insights for weeks with no reviews
   */
  private generateEmptyInsights(
    businessId: string,
    weekStart: Date,
    weekEnd: Date
  ): WeeklyDigestInsights {
    return {
      id: crypto.randomUUID(),
      business_id: businessId,
      week_start: this.formatDate(weekStart),
      week_end: this.formatDate(weekEnd),
      stats: {
        totalReviews: 0,
        averageRating: 0,
        responseRate: 0,
        weekOverWeekChange: 0,
        uniqueCustomers: 0,
        satisfactionDrivers: [],
        ratingBreakdown: {}
      },
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
      overallConfidence: 1.0,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Cache insights in the weekly_digests table
   */
  private async cacheInsights(insights: WeeklyDigestInsights): Promise<void> {
    try {
      // Transform insights to match database schema
      const ratingBreakdown = this.generateRatingBreakdown(insights.stats);
      // Extend rating_breakdown to include calculated stats
      const extendedRatingBreakdown = {
        ...ratingBreakdown,
        averageRating: insights.stats.averageRating,
        responseRate: insights.stats.responseRate,
        uniqueCustomers: insights.stats.uniqueCustomers
      };

      const cacheData = {
        business_id: insights.business_id,
        week_start: insights.week_start,
        week_end: insights.week_end,
        total_reviews: insights.stats.totalReviews,
        rating_breakdown: extendedRatingBreakdown,
        positive_themes: insights.positiveThemes.map(t => t.theme),
        improvement_themes: insights.improvementThemes.map(t => t.theme),
        highlights: insights.highlights,
        generated_at: insights.generated_at
      };

      const { error } = await supabase
        .from('weekly_digests')
        .upsert(cacheData, {
          onConflict: 'business_id,week_start'
        });

      if (error) {
        console.error('Error caching insights:', error);
        // Don't throw - caching failure shouldn't break the main flow
      }
    } catch (error) {
      console.error('Error caching insights:', error);
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  /**
   * Transform cached digest to insights format
   */
  private transformCachedToInsights(cached: CachedDigest): WeeklyDigestInsights {
    return {
      id: cached.id,
      business_id: cached.business_id,
      week_start: cached.week_start,
      week_end: cached.week_end,
      stats: {
        totalReviews: cached.total_reviews,
        averageRating: cached.rating_breakdown.averageRating || this.calculateAverageFromBreakdown(cached.rating_breakdown),
        responseRate: cached.rating_breakdown.responseRate || 0,
        weekOverWeekChange: 0,
        uniqueCustomers: cached.rating_breakdown.uniqueCustomers || Math.floor(cached.total_reviews * 0.8),
        satisfactionDrivers: [],
        ratingBreakdown: cached.rating_breakdown
      },
      positiveThemes: cached.positive_themes.map(theme => ({
        theme,
        specificExample: 'Cached insight - regenerate for details',
        impactAssessment: 'Previously analyzed theme',
        recommendedAction: 'Review detailed analysis',
        priority: 'medium' as const,
        affectedCustomerCount: 1,
        implementationComplexity: 'moderate' as const,
        potentialROI: 'See detailed analysis',
        confidence: 0.8
      })),
      improvementThemes: cached.improvement_themes.map(theme => ({
        theme,
        specificExample: 'Cached insight - regenerate for details',
        impactAssessment: 'Previously identified improvement area',
        recommendedAction: 'Review detailed analysis',
        priority: 'medium' as const,
        affectedCustomerCount: 1,
        implementationComplexity: 'moderate' as const,
        potentialROI: 'See detailed analysis',
        confidence: 0.8
      })),
      highlights: Array.isArray(cached.highlights) ? cached.highlights : [],
      competitiveInsights: {
        competitorMentions: [],
        uniqueValueProps: ['Quality service delivery'],
        marketPositioning: {
          pricePerception: 'value',
          qualityPosition: 'standard',
          serviceLevel: 'good'
        }
      },
      overallConfidence: 0.8,
      generated_at: cached.generated_at,
      created_at: cached.created_at
    };
  }

  /**
   * Utility: Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Utility: Get date range string from reviews
   */
  private getDateRange(reviews: Review[]): string {
    if (reviews.length === 0) return 'No reviews';
    
    const dates = reviews.map(r => new Date(r.review_date));
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
  }

  /**
   * Utility: Generate rating breakdown for caching
   */
  private generateRatingBreakdown(stats: DigestStats): Record<string, number> {
    // Use the actual rating breakdown from stats, or return empty if not available
    return stats.ratingBreakdown || {};
  }

  /**
   * Utility: Calculate average rating from breakdown
   */
  private calculateAverageFromBreakdown(breakdown: Record<string, number>): number {
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return 0;

    const totalWeightedScore = entries.reduce((sum, [rating, count]) => 
      sum + (parseInt(rating) * count), 0);
    const totalReviews = entries.reduce((sum, [, count]) => sum + count, 0);

    return totalReviews > 0 ? Math.round((totalWeightedScore / totalReviews) * 10) / 10 : 0;
  }
}

// ==========================================
// EXPORTED FUNCTIONS
// ==========================================

/**
 * Main function to generate weekly insights
 */
export async function generateWeeklyInsights(
  businessId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyDigestInsights> {
  const service = new DigestInsightsService();
  return service.generateWeeklyInsights(businessId, weekStart, weekEnd);
}

/**
 * Get current week date range
 */
export function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  return { weekStart, weekEnd };
}

/**
 * Get previous week date range
 */
export function getPreviousWeekRange(): { weekStart: Date; weekEnd: Date } {
  const current = getCurrentWeekRange();
  const weekStart = new Date(current.weekStart);
  weekStart.setDate(current.weekStart.getDate() - 7);
  
  const weekEnd = new Date(current.weekEnd);
  weekEnd.setDate(current.weekEnd.getDate() - 7);
  
  return { weekStart, weekEnd };
}