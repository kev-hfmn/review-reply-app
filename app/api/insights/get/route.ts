import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { checkUserSubscription, hasFeature } from '@/lib/utils/subscription';
import type { WeeklyDigestInsights } from '@/lib/services/insightsService';

export async function POST(request: Request) {
  try {
    const { businessId, weekStart, weekEnd, userId } = await request.json();

    // Basic validation - the user should be passed from the client
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check subscription status using centralized utility
    const subscriptionStatus = await checkUserSubscription(userId);

    // Check if user has advanced insights feature
    if (!hasFeature(subscriptionStatus.planId, 'advancedInsights')) {
      return NextResponse.json(
        {
          error: 'Advanced insights not available',
          message: 'AI-powered insights require a Pro plan or higher.',
          requiredPlan: 'pro',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      );
    }

    // Validate required parameters
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Validate date parameters
    let startDate: Date;
    let endDate: Date;

    if (weekStart && weekEnd) {
      startDate = new Date(weekStart);
      endDate = new Date(weekEnd);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Week start and end dates are required' },
        { status: 400 }
      );
    }

    // Verify business exists and user has access (security check)
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('user_id', userId) // Ensure user owns this business
      .single();

    if (businessError || !businessData) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Look for cached insights - FETCH ONLY, no generation
    const weekStartStr = startDate.toISOString().split('T')[0];

    const { data: cachedDigest, error: cacheError } = await supabaseAdmin
      .from('weekly_digests')
      .select('*')
      .eq('business_id', businessId)
      .eq('week_start', weekStartStr)
      .single();

    if (cacheError || !cachedDigest) {
      // No cached insights found - return null (no generation)
      return NextResponse.json({
        success: true,
        insights: null,
        businessName: businessData.name,
        message: 'No cached insights found for this period'
      });
    }

    // Check if cache is stale (older than 24 hours)
    const cacheAge = Date.now() - new Date(cachedDigest.generated_at).getTime();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const isStale = cacheAge > staleThreshold;

    // Check if prompt version is outdated
    const currentVersion = 'v2.1';
    const isPromptOutdated = cachedDigest.prompt_version !== currentVersion;

    if (isStale || isPromptOutdated) {
      return NextResponse.json({
        success: true,
        insights: null,
        businessName: businessData.name,
        message: isStale ? 'Cached insights are stale' : 'Cached insights use outdated analysis version',
        cacheInfo: {
          isStale,
          isPromptOutdated,
          cacheAge: Math.round(cacheAge / (60 * 60 * 1000)), // hours
          promptVersion: cachedDigest.prompt_version || 'legacy'
        }
      });
    }

    // Transform cached data back to insights format
    const insights = transformCachedToInsights(cachedDigest);

    return NextResponse.json({
      success: true,
      insights,
      businessName: businessData.name,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      generatedAt: insights.generated_at,
      confidence: insights.overallConfidence,
      fromCache: true
    });

  } catch (error: unknown) {
    console.error('Insights fetch error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insights';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Unable to fetch insights at this time. Please try again later.'
      },
      { status: 500 }
    );
  }
}

interface CachedDigest {
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
  // Enhanced v2.1 fields
  ai_analysis_complete?: unknown;
  review_aggregation_data?: unknown;
  competitive_insights?: unknown;
  overall_confidence?: number;
  prompt_version?: string;
}

/**
 * Transform cached digest to insights format
 * Handles both v2.1 complete cache and legacy format
 */
function transformCachedToInsights(cached: CachedDigest): WeeklyDigestInsights {
  // Check if we have the new comprehensive cache data
  const hasCompleteCache = cached.ai_analysis_complete && cached.prompt_version;
  
  if (hasCompleteCache) {
    console.log('✅ Loading insights from complete cache (v2.1+)');
    
    // Use the complete cached AI analysis
    const aiData = cached.ai_analysis_complete as Record<string, unknown>;
    
    return {
      id: cached.id,
      business_id: cached.business_id,
      week_start: cached.week_start,
      week_end: cached.week_end,
      stats: aiData.stats || {
        totalReviews: cached.total_reviews,
        averageRating: cached.rating_breakdown.averageRating || calculateAverageFromBreakdown(cached.rating_breakdown),
        responseRate: cached.rating_breakdown.responseRate || 0,
        weekOverWeekChange: 0,
        uniqueCustomers: cached.rating_breakdown.uniqueCustomers || Math.floor(cached.total_reviews * 0.8),
        satisfactionDrivers: [],
        ratingBreakdown: cached.rating_breakdown
      },
      positiveThemes: aiData.positiveThemes || [],
      improvementThemes: aiData.improvementThemes || [],
      highlights: aiData.highlights || [],
      reviewAggregation: cached.review_aggregation_data || undefined,
      competitiveInsights: cached.competitive_insights || {
        competitorMentions: [],
        uniqueValueProps: ['Quality service delivery'],
        marketPositioning: {
          pricePerception: 'value' as const,
          qualityPosition: 'standard' as const,
          serviceLevel: 'good' as const
        }
      },
      overallConfidence: cached.overall_confidence || aiData.overallConfidence || 0.85,
      generated_at: cached.generated_at,
      created_at: cached.created_at
    };
  }
  
  // Fallback for legacy cache format
  console.log('⚠️ Loading insights from legacy cache - consider regenerating for enhanced features');
  return {
    id: cached.id,
    business_id: cached.business_id,
    week_start: cached.week_start,
    week_end: cached.week_end,
    stats: {
      totalReviews: cached.total_reviews,
      averageRating: cached.rating_breakdown.averageRating || calculateAverageFromBreakdown(cached.rating_breakdown),
      responseRate: cached.rating_breakdown.responseRate || 0,
      weekOverWeekChange: 0,
      uniqueCustomers: cached.rating_breakdown.uniqueCustomers || Math.floor(cached.total_reviews * 0.8),
      satisfactionDrivers: [],
      ratingBreakdown: cached.rating_breakdown
    },
    positiveThemes: cached.positive_themes.map((theme: string) => ({
      theme,
      specificExample: 'Legacy cache - refresh insights for complete analysis',
      impactAssessment: 'Previously analyzed theme',
      recommendedAction: '🔄 Refresh for enhanced insights',
      priority: 'medium' as const,
      affectedCustomerCount: 1,
      implementationComplexity: 'moderate' as const,
      potentialROI: 'Refresh for detailed analysis',
      confidence: 0.8
    })),
    improvementThemes: cached.improvement_themes.map((theme: string) => ({
      theme,
      specificExample: 'Legacy cache - refresh insights for complete analysis',
      impactAssessment: 'Previously identified improvement area',
      recommendedAction: '🔄 Refresh for enhanced insights',
      priority: 'medium' as const,
      affectedCustomerCount: 1,
      implementationComplexity: 'moderate' as const,
      potentialROI: 'Refresh for detailed analysis',
      confidence: 0.8
    })),
    highlights: Array.isArray(cached.highlights) ? cached.highlights.filter((h: unknown) => 
      h !== null && typeof h === 'object' && 
      'id' in h && 'customer_name' in h && 'rating' in h && 'review_text' in h
    ) : [],
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
 * Calculate average rating from breakdown
 */
function calculateAverageFromBreakdown(breakdown: Record<string, number>): number {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return 0;

  const totalWeightedScore = entries.reduce((sum, [rating, count]) => 
    sum + (parseInt(rating) * count), 0);
  const totalReviews = entries.reduce((sum, [, count]) => sum + count, 0);

  return totalReviews > 0 ? Math.round((totalWeightedScore / totalReviews) * 10) / 10 : 0;
}