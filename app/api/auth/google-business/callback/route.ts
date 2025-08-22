import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { exchangeCodeForTokens, decodeStateParameter, discoverBusinessLocations } from '@/lib/services/googleOAuthService';
import { encryptFields } from '@/lib/services/encryptionService';

/**
 * Handle Google Business Profile OAuth callback with platform credentials
 * GET /api/auth/google-business/callback
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=oauth_failed`
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in OAuth callback');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=invalid_callback`
      );
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = decodeStateParameter(state);
    } catch (error) {
      console.error('Invalid state parameter:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=invalid_state`
      );
    }

    const { businessId, userId } = stateData;

    // Get business and verify ownership
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      console.error('Business not found in callback:', businessError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=business_not_found`
      );
    }

    try {
      console.log('🔄 Exchanging code for tokens with platform credentials...');
      const tokens = await exchangeCodeForTokens(code);
      
      console.log('✅ Tokens received, discovering business locations...');
      const businessLocations = await discoverBusinessLocations(tokens.access_token);
      
      if (businessLocations.length === 0) {
        console.error('No business locations found for user');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=no_business_locations`
        );
      }

      // For now, if there's only one location, auto-select it
      // If multiple locations, we'll redirect to selection page (to be implemented)
      const selectedLocation = businessLocations[0];
      if (businessLocations.length > 1) {
        // Store tokens temporarily and redirect to location selection
        console.log('🔄 Multiple locations found, need location selection...');
        // For now, just use the first one - location selection UI will be implemented later
        console.log('📍 Auto-selecting first location for now:', selectedLocation.businessName);
      }

      // Store tokens and business info encrypted in database
      const tokenData = {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_account_id: selectedLocation.accountId,
        google_location_id: selectedLocation.locationId,
      };

      const encryptedTokens = encryptFields(tokenData, [
        'google_access_token',
        'google_refresh_token',
        'google_account_id',
        'google_location_id'
      ]);

      // Update business with OAuth tokens and business info
      const { error: updateError } = await supabaseAdmin
        .from('businesses')
        .update({
          ...encryptedTokens,
          google_account_name: selectedLocation.accountName,
          google_business_name: selectedLocation.businessName,
          google_location_name: selectedLocation.locationName,
          connection_status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Failed to store OAuth tokens:', updateError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=token_storage_failed`
        );
      }

      console.log('✅ Successfully connected:', selectedLocation.businessName);

      // Create activity log entry
      await supabaseAdmin
        .from('activities')
        .insert({
          business_id: businessId,
          type: 'settings_updated',
          description: `Google Business Profile connected: ${selectedLocation.businessName}`,
          metadata: {
            event: 'google_oauth_connected',
            business_name: selectedLocation.businessName,
            location_name: selectedLocation.locationName,
            account_id: selectedLocation.accountId,
            location_id: selectedLocation.locationId,
            timestamp: new Date().toISOString(),
          },
        });

      // Redirect to settings with success
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&success=google_connected&business_name=${encodeURIComponent(selectedLocation.businessName)}`
      );

    } catch (tokenError) {
      console.error('❌ OAuth process failed:', tokenError);
      
      // Update connection status to failed
      await supabaseAdmin
        .from('businesses')
        .update({ connection_status: 'error' })
        .eq('id', businessId);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=oauth_process_failed`
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=callback_failed`
    );
  }
}