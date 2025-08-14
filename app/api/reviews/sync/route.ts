import { NextRequest, NextResponse } from 'next/server';
import { syncReviews } from '@/lib/services/googleBusinessService';

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