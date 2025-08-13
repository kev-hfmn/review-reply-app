import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { generateAuthUrl, generateSecureState } from '@/lib/services/googleOAuthService';
import { decryptFields } from '@/lib/services/encryptionService';

/**
 * Initiate Google Business Profile OAuth flow
 * POST /api/auth/google-business/initiate
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
      .select('id, user_id, google_client_id, google_client_secret, google_account_id, google_location_id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Check if Google credentials are configured
    if (!business.google_client_id || !business.google_client_secret || 
        !business.google_account_id || !business.google_location_id) {
      return NextResponse.json(
        { error: 'Google credentials not configured. Please configure in Settings first.' },
        { status: 400 }
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
      console.log('Using plain text credentials (not encrypted)');
      credentials = {
        clientId: business.google_client_id,
        clientSecret: business.google_client_secret,
        accountId: business.google_account_id,
        locationId: business.google_location_id,
      };
    }

    const state = generateSecureState(businessId, userId);
    const authUrl = generateAuthUrl(credentials, state);

    return NextResponse.json({
      authUrl,
      message: 'OAuth URL generated successfully',
    });

  } catch (error) {
    console.error('OAuth initiate error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}