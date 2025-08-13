import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { exchangeCodeForTokens, decodeStateParameter } from '@/lib/services/googleOAuthService';
import { encryptFields, decryptFields } from '@/lib/services/encryptionService';

/**
 * Handle Google Business Profile OAuth callback
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
      .select('id, user_id, google_client_id, google_client_secret, google_account_id, google_location_id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      console.error('Business not found in callback:', businessError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=business_not_found`
      );
    }

    // Check if Google credentials are configured
    if (!business.google_client_id || !business.google_client_secret ||
        !business.google_account_id || !business.google_location_id) {
      console.error('Google credentials not configured for business:', businessId);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=credentials_missing`
      );
    }

    // Try to decrypt credentials, fallback to plain text if not encrypted
    let credentials;
    try {
      const decryptedBusiness = decryptFields(business, [
        'google_client_id',
        'google_client_secret',
        'google_account_id',
        'google_location_id'
      ]);

      credentials = {
        clientId: decryptedBusiness.google_client_id,
        clientSecret: decryptedBusiness.google_client_secret,
        accountId: decryptedBusiness.google_account_id,
        locationId: decryptedBusiness.google_location_id,
      };
    } catch (decryptError) {
      // If decryption fails, assume they're stored as plain text (backward compatibility)
      console.log('Using plain text credentials in callback (not encrypted)');
      credentials = {
        clientId: business.google_client_id,
        clientSecret: business.google_client_secret,
        accountId: business.google_account_id,
        locationId: business.google_location_id,
      };
    }

    try {
      const tokens = await exchangeCodeForTokens(code, credentials);
      
      // Store tokens encrypted in database
      const tokenData = {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      };

      const encryptedTokens = encryptFields(tokenData, [
        'google_access_token',
        'google_refresh_token'
      ]);

      // Update business with OAuth tokens
      const { error: updateError } = await supabaseAdmin
        .from('businesses')
        .update({
          ...encryptedTokens,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Failed to store OAuth tokens:', updateError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=token_storage_failed`
        );
      }

      // Create activity log entry
      await supabaseAdmin
        .from('activities')
        .insert({
          business_id: businessId,
          type: 'settings_updated',
          description: 'Google Business Profile connected successfully',
          metadata: {
            event: 'google_oauth_connected',
            timestamp: new Date().toISOString(),
          },
        });

      // Redirect to settings with success
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&success=google_connected`
      );

    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=token_exchange_failed`
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=callback_failed`
    );
  }
}