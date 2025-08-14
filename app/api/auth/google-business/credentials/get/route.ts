import { NextRequest, NextResponse } from 'next/server';
import { decryptFields } from '@/lib/services/encryptionService';
import { supabaseAdmin } from '@/utils/supabase-admin';

/**
 * Get Google Business Profile credentials (decrypted for display)
 * GET /api/auth/google-business/credentials/get
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

    // Verify business ownership
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id, google_client_id, google_client_secret, google_account_id, google_location_id, google_access_token, google_refresh_token')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Check if Google credentials exist
    const hasGoogleCredentials = business.google_client_id && 
                                  business.google_client_secret && 
                                  business.google_account_id && 
                                  business.google_location_id;

    const hasGoogleTokens = business.google_access_token && business.google_refresh_token;

    if (!hasGoogleCredentials) {
      return NextResponse.json({
        hasCredentials: false,
        hasTokens: hasGoogleTokens,
        credentials: null,
      });
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
    } catch {
      // If decryption fails, assume they're stored as plain text (backward compatibility)
      console.log('Using plain text credentials for display (not encrypted)');
      credentials = {
        clientId: business.google_client_id,
        clientSecret: business.google_client_secret,
        accountId: business.google_account_id,
        locationId: business.google_location_id,
      };
    }

    return NextResponse.json({
      hasCredentials: true,
      hasTokens: hasGoogleTokens,
      credentials,
    });

  } catch (error) {
    console.error('Get credentials API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}