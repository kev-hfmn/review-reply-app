import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { refreshAccessToken } from '@/lib/services/googleOAuthService';
import { encryptFields, decryptFields } from '@/lib/services/encryptionService';

/**
 * Refresh Google Business Profile access token
 * POST /api/auth/google-business/refresh
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
      .select('id, user_id, google_client_id, google_client_secret, google_refresh_token')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Check if tokens exist
    if (!business.google_client_id || !business.google_client_secret || !business.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google credentials or refresh token not found. Please re-authenticate.' },
        { status: 400 }
      );
    }

    // Decrypt credentials
    const decryptedBusiness = decryptFields(business, [
      'google_client_id',
      'google_client_secret',
      'google_refresh_token'
    ]);

    try {
      // Refresh the access token
      const newTokens = await refreshAccessToken(
        decryptedBusiness.google_refresh_token,
        {
          clientId: decryptedBusiness.google_client_id,
          clientSecret: decryptedBusiness.google_client_secret,
        }
      );

      // Encrypt and store new access token
      const tokenData = {
        google_access_token: newTokens.access_token,
      };

      const encryptedTokens = encryptFields(tokenData, ['google_access_token']);

      // Update business with new access token
      const { error: updateError } = await supabaseAdmin
        .from('businesses')
        .update({
          ...encryptedTokens,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Failed to store refreshed token:', updateError);
        return NextResponse.json(
          { error: 'Failed to store refreshed token' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Access token refreshed successfully',
        expires_in: newTokens.expires_in,
      });

    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // If refresh token is invalid, clear all Google tokens
      await supabaseAdmin
        .from('businesses')
        .update({
          google_access_token: null,
          google_refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      return NextResponse.json(
        { 
          error: 'Refresh token expired or invalid. Please re-authenticate.',
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh access token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}