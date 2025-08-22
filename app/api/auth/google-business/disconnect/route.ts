import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

/**
 * Disconnect Google Business Profile integration
 * POST /api/auth/google-business/disconnect
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await request.json();

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get business and verify ownership
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id, google_business_name')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    const businessName = business.google_business_name || 'Google Business Profile';

    try {
      // Clear all Google Business Profile data
      const { error: updateError } = await supabaseAdmin
        .from('businesses')
        .update({
          // Clear tokens and credentials
          google_access_token: null,
          google_refresh_token: null,
          google_account_id: null,
          google_location_id: null,
          
          // Clear business information
          google_account_name: null,
          google_business_name: null,
          google_location_name: null,
          
          // Update connection status
          connection_status: 'disconnected',
          last_connection_attempt: null,
          
          // Clear sync data - user will need to re-sync reviews after reconnecting
          last_review_sync: null,
          initial_backfill_complete: false,
          
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Failed to disconnect Google Business Profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to disconnect Google Business Profile' },
          { status: 500 }
        );
      }

      // Create activity log entry
      await supabaseAdmin
        .from('activities')
        .insert({
          business_id: businessId,
          type: 'settings_updated',
          description: `Google Business Profile disconnected: ${businessName}`,
          metadata: {
            event: 'google_business_profile_disconnected',
            business_name: businessName,
            timestamp: new Date().toISOString(),
            note: 'All Google credentials and sync data cleared',
          },
        });

      console.log('✅ Google Business Profile disconnected successfully for business:', businessId);

      return NextResponse.json({
        message: 'Google Business Profile disconnected successfully',
        disconnectedBusiness: businessName,
      });

    } catch (disconnectError) {
      console.error('❌ Error during disconnection:', disconnectError);
      return NextResponse.json(
        { 
          error: 'Failed to disconnect Google Business Profile',
          details: disconnectError instanceof Error ? disconnectError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Disconnect API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disconnect Google Business Profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}