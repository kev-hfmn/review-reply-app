import { NextResponse } from 'next/server';
import { generateWeeklyInsights } from '@/lib/services/digestInsightsService';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { checkUserSubscription } from '@/lib/utils/subscription';

export async function POST(request: Request) {
  try {
    const { businessId, weekStart, weekEnd, forceRegenerate = false, userId } = await request.json();

    // Basic validation - the user should be passed from the client
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check subscription status using centralized utility
    const subscriptionStatus = await checkUserSubscription(userId);

    if (!subscriptionStatus.isSubscriber) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: 'AI-powered digest insights require an active subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED'
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
      // Default to current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
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

    // Clear cache to force fresh generation when explicitly requested
    if (forceRegenerate) {
      console.log('Clearing cached insights to force fresh generation...');
      await clearCachedInsights(businessId, startDate);
    }

    // Generate insights using the service
    const insights = await generateWeeklyInsights(businessId, startDate, endDate);

    // Return the insights with success status
    return NextResponse.json({
      success: true,
      insights,
      businessName: businessData.name,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      generatedAt: insights.generated_at,
      confidence: insights.overallConfidence
    });

  } catch (error: unknown) {
    console.error('Insights generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate insights';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Unable to generate insights at this time. Please try again later.'
      },
      { status: 500 }
    );
  }
}

/**
 * Clear cached insights for force regeneration
 */
async function clearCachedInsights(businessId: string, weekStart: Date): Promise<void> {
  try {
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { error } = await supabaseAdmin
      .from('weekly_digests')
      .delete()
      .eq('business_id', businessId)
      .eq('week_start', weekStartStr);

    if (error) {
      console.error('Error clearing cached insights:', error);
      // Don't throw - clearing cache failure shouldn't break regeneration
    }
  } catch (error) {
    console.error('Error clearing cached insights:', error);
    // Don't throw - clearing cache failure shouldn't break regeneration
  }
}
