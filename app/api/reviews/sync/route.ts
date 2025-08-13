import { NextRequest, NextResponse } from 'next/server';
import { syncReviews, testConnection } from '@/lib/services/googleBusinessService';

/**
 * Sync reviews from Google Business Profile
 * POST /api/reviews/sync
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId, action = 'sync' } = await request.json();

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Handle test connection
    if (action === 'test') {
      const testResult = await testConnection(businessId);
      return NextResponse.json(testResult);
    }

    // Handle full sync
    if (action === 'sync') {
      console.log(`Starting review sync for business ${businessId}`);
      
      const syncResult = await syncReviews(businessId, userId);
      
      const statusCode = syncResult.success ? 200 : 207; // 207 = Multi-Status (partial success)
      
      return NextResponse.json(syncResult, { status: statusCode });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "test" or "sync"' },
      { status: 400 }
    );

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