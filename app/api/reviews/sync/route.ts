import { NextRequest, NextResponse } from 'next/server';
import { syncReviews } from '@/lib/services/googleBusinessService';
import { createClient } from '@supabase/supabase-js';

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

    // Check subscription status for access control
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle();

    const isSubscriber = subscription && 
      subscription.status === 'active' && 
      new Date(subscription.current_period_end) > new Date();

    if (!isSubscriber) {
      return NextResponse.json(
        { 
          error: 'Subscription required',
          message: 'Review syncing requires an active subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }

    console.log(`🚀 Starting two-phase review sync for business ${businessId}, user ${userId}`);
    
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