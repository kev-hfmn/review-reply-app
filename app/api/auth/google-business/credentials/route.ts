import { NextRequest, NextResponse } from 'next/server';
import { encryptFields } from '@/lib/services/encryptionService';
import { supabaseAdmin } from '@/utils/supabase-admin';

/**
 * Save Google Business Profile credentials (encrypted)
 * POST /api/auth/google-business/credentials
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId, credentials } = await request.json();

    if (!businessId || !userId || !credentials) {
      return NextResponse.json(
        { error: 'Business ID, User ID, and credentials are required' },
        { status: 400 }
      );
    }

    const { clientId, clientSecret, accountId, locationId } = credentials;

    if (!clientId || !clientSecret || !accountId || !locationId) {
      return NextResponse.json(
        { error: 'All credential fields are required' },
        { status: 400 }
      );
    }

    // Verify business ownership
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

    // Encrypt credentials
    const credentialsToEncrypt = {
      google_client_id: clientId,
      google_client_secret: clientSecret,
      google_account_id: accountId,
      google_location_id: locationId,
    };

    const encryptedCredentials = encryptFields(credentialsToEncrypt, [
      'google_client_id',
      'google_client_secret',
      'google_account_id',
      'google_location_id',
    ]);

    // Update business with encrypted credentials
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        ...encryptedCredentials,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('Failed to save credentials:', updateError);
      return NextResponse.json(
        { error: 'Failed to save credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully',
    });

  } catch (error) {
    console.error('Credentials API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}