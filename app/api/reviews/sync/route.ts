import { NextRequest, NextResponse } from 'next/server';
import { syncReviews } from '@/lib/services/googleBusinessService';
import { createClient } from '@supabase/supabase-js';
import { checkUserSubscription, hasFeature, getPlanLimit } from '@/lib/utils/subscription';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Sync reviews from Google Business Profile
 * POST /api/reviews/sync
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      businessId,
      userId,
      options = { timePeriod: '30days', reviewCount: 50 }
    } = await request.json();

    // Basic validation - the user should be passed from the client
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Check subscription status using centralized utility
    const subscription = await checkUserSubscription(userId);
    
    // Check if user has review sync feature
    if (!hasFeature(subscription.planId, 'reviewSync')) {
      return NextResponse.json(
        { 
          error: 'Review sync not available on Basic plan',
          message: 'Review syncing requires a Starter plan or higher.',
          requiredPlan: 'starter',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }

    // Get and apply plan-specific review limits
    const maxReviews = getPlanLimit(subscription.planId, 'maxReviewsPerSync');
    
    if (maxReviews === 0) {
      return NextResponse.json(
        { 
          error: 'Review sync not available',
          message: 'Your current plan does not include review syncing.',
          requiredPlan: 'starter'
        },
        { status: 403 }
      );
    }

    // Apply limit to sync operation (if not unlimited)
    if (maxReviews !== -1 && typeof maxReviews === 'number') {
      options.reviewCount = Math.min(options.reviewCount || 50, maxReviews);
      console.log(`📊 Applying plan limit: max ${maxReviews} reviews for ${subscription.planId} plan`);
    }

    console.log(`🚀 Starting two-phase review sync for business ${businessId}, user ${userId}, plan: ${subscription.planId}`);
    
    const syncResult = await syncReviews(businessId, userId, options);
    
    const statusCode = syncResult.success ? 200 : 207; // 207 = Multi-Status (partial success)
    
    return NextResponse.json(syncResult, { status: statusCode });

  } catch (error) {
    console.error('Reviews sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Sync failed due to server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        totalFetched: 0,
        newReviews: 0,
        updatedReviews: 0,
        errors: [error instanceof Error ? error.message : 'Unknown server error'],
        lastSyncTime: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}