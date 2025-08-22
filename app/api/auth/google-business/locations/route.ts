import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { discoverBusinessLocations } from '@/lib/services/googleOAuthService';
import { decryptFields } from '@/lib/services/encryptionService';

/**
 * Get available business locations for the authenticated user
 * GET /api/auth/google-business/locations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const userId = searchParams.get('userId');

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get business and verify ownership
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id, google_access_token, connection_status')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    if (!business.google_access_token) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected. Please authenticate first.' },
        { status: 400 }
      );
    }

    // Decrypt access token
    let accessToken;
    try {
      const decrypted = decryptFields(business, ['google_access_token']);
      accessToken = decrypted.google_access_token;
    } catch {
      // Fallback to plain text for backward compatibility
      accessToken = business.google_access_token;
    }

    try {
      console.log('🔍 Fetching business locations for user...');
      const businessLocations = await discoverBusinessLocations(accessToken);

      return NextResponse.json({
        locations: businessLocations,
        total: businessLocations.length,
        message: `Found ${businessLocations.length} business location${businessLocations.length !== 1 ? 's' : ''}`,
      });

    } catch (discoveryError) {
      console.error('❌ Business location discovery failed:', discoveryError);
      
      // If token is invalid, mark as needing reconnection
      if (discoveryError instanceof Error && discoveryError.message.includes('401')) {
        await supabaseAdmin
          .from('businesses')
          .update({ connection_status: 'needs_reconnection' })
          .eq('id', businessId);
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch business locations',
          details: discoveryError instanceof Error ? discoveryError.message : 'Unknown error',
          requiresReauth: discoveryError instanceof Error && discoveryError.message.includes('401'),
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Locations API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch business locations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update selected business location
 * POST /api/auth/google-business/locations
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId, accountId, locationId, accountName, businessName, locationName } = await request.json();

    if (!businessId || !userId || !accountId || !locationId) {
      return NextResponse.json(
        { error: 'Business ID, User ID, Account ID, and Location ID are required' },
        { status: 400 }
      );
    }

    // Get business and verify ownership
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Update business with selected location
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        google_account_id: accountId,
        google_location_id: locationId,
        google_account_name: accountName,
        google_business_name: businessName,
        google_location_name: locationName,
        connection_status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('Failed to update business location:', updateError);
      return NextResponse.json(
        { error: 'Failed to update business location' },
        { status: 500 }
      );
    }

    // Create activity log entry
    await supabaseAdmin
      .from('activities')
      .insert({
        business_id: businessId,
        type: 'settings_updated',
        description: `Business location updated: ${businessName}`,
        metadata: {
          event: 'business_location_selected',
          business_name: businessName,
          location_name: locationName,
          account_id: accountId,
          location_id: locationId,
          timestamp: new Date().toISOString(),
        },
      });

    console.log('✅ Business location updated successfully:', businessName);

    return NextResponse.json({
      message: 'Business location updated successfully',
      businessInfo: {
        accountId,
        locationId,
        accountName,
        businessName,
        locationName,
      },
    });

  } catch (error) {
    console.error('❌ Location update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update business location',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}