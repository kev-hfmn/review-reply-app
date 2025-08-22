import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { refreshAccessToken } from '@/lib/services/googleOAuthService';
import { encryptFields, decryptFields } from '@/lib/services/encryptionService';

/**
 * Refresh Google Business Profile access token with platform credentials
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
      .select('id, user_id, google_refresh_token, connection_status')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Check if refresh token exists
    if (!business.google_refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token not found. Please re-authenticate.' },
        { status: 400 }
      );
    }

    // Decrypt refresh token
    let refreshToken;
    try {
      const decryptedBusiness = decryptFields(business, ['google_refresh_token']);
      refreshToken = decryptedBusiness.google_refresh_token;
    } catch {
      // Fallback to plain text for backward compatibility
      refreshToken = business.google_refresh_token;
    }

    try {
      // Refresh the access token using platform credentials
      const newTokens = await refreshAccessToken(refreshToken);

      // Encrypt and store new access token
      const tokenData = {
        google_access_token: newTokens.access_token,
      };

      const encryptedTokens = encryptFields(tokenData, ['google_access_token']);

      // Update business with new access token and connection status
      const { error: updateError } = await supabaseAdmin
        .from('businesses')
        .update({
          ...encryptedTokens,
          connection_status: 'connected',
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

      console.log('✅ Access token refreshed successfully for business:', businessId);

      return NextResponse.json({
        message: 'Access token refreshed successfully',
        expires_in: newTokens.expires_in,
      });

    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      
      // If refresh token is invalid, mark as needing reconnection
      await supabaseAdmin
        .from('businesses')
        .update({
          connection_status: 'needs_reconnection',
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