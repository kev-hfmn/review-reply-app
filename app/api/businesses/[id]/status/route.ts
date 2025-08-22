import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

/**
 * Get business connection status
 * GET /api/businesses/[id]/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const businessId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get business and verify ownership (post-migration with all new fields)
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select(`
        id, 
        user_id, 
        google_access_token,
        google_refresh_token,
        google_account_id,
        google_location_id,
        google_account_name,
        google_business_name,
        google_location_name,
        connection_status,
        last_review_sync,
        last_connection_attempt
      `)
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Determine connection status (post-migration with full tracking)
    const hasTokens = business.google_access_token && business.google_refresh_token;
    const connectionStatus = business.connection_status || (hasTokens ? 'connected' : 'disconnected');

    // Build business info from new database fields
    let businessInfo = null;
    if (hasTokens && (business.google_business_name || business.google_account_name)) {
      businessInfo = {
        accountName: business.google_account_name || 'Google Business Profile',
        businessName: business.google_business_name || 'Connected Business',
        locationName: business.google_location_name || business.google_location_id || 'Unknown Location',
        verified: connectionStatus === 'connected',
      };
    }

    return NextResponse.json({
      connected: hasTokens && connectionStatus === 'connected',
      status: connectionStatus,
      lastSync: business.last_review_sync,
      businessInfo,
      lastConnectionAttempt: business.last_connection_attempt,
    });

  } catch (error) {
    console.error('❌ Business status API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get business status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}