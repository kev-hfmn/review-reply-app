import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { validateBusinessConnection } from '@/lib/services/googleBusinessService';
import { decryptFields } from '@/lib/services/encryptionService';

/**
 * Test Google Business Profile connection
 * POST /api/auth/google-business/test
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
      .select(`
        id, 
        user_id, 
        google_access_token,
        google_refresh_token,
        google_account_id,
        google_location_id,
        google_business_name,
        connection_status
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

    if (!business.google_access_token || !business.google_location_id) {
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
      console.log('🧪 Testing Google Business Profile connection...');
      
      const isValid = await validateBusinessConnection(
        accessToken,
        business.google_account_id!,
        business.google_location_id!
      );

      if (isValid) {
        // Update connection status to confirmed
        await supabaseAdmin
          .from('businesses')
          .update({ 
            connection_status: 'connected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);

        // Log successful test
        await supabaseAdmin
          .from('activities')
          .insert({
            business_id: businessId,
            type: 'system_test',
            description: 'Google Business Profile connection test successful',
            metadata: {
              event: 'connection_test_passed',
              business_name: business.google_business_name,
              timestamp: new Date().toISOString(),
            },
          });

        return NextResponse.json({
          success: true,
          message: `Connection verified successfully for ${business.google_business_name}`,
          businessName: business.google_business_name,
        });

      } else {
        // Mark as needing reconnection
        await supabaseAdmin
          .from('businesses')
          .update({ 
            connection_status: 'needs_reconnection',
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);

        return NextResponse.json(
          { 
            success: false,
            message: 'Connection test failed. Access may have been revoked or expired.',
            requiresReauth: true,
          },
          { status: 400 }
        );
      }

    } catch (testError) {
      console.error('❌ Connection test failed:', testError);

      // Log failed test
      await supabaseAdmin
        .from('activities')
        .insert({
          business_id: businessId,
          type: 'system_test',
          description: 'Google Business Profile connection test failed',
          metadata: {
            event: 'connection_test_failed',
            business_name: business.google_business_name,
            error: testError instanceof Error ? testError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        });

      // Update status based on error type
      const requiresReauth = testError instanceof Error && 
        (testError.message.includes('401') || testError.message.includes('403'));

      if (requiresReauth) {
        await supabaseAdmin
          .from('businesses')
          .update({ 
            connection_status: 'needs_reconnection',
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);
      } else {
        await supabaseAdmin
          .from('businesses')
          .update({ 
            connection_status: 'error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId);
      }

      return NextResponse.json(
        { 
          success: false,
          message: 'Connection test failed due to an error',
          details: testError instanceof Error ? testError.message : 'Unknown error',
          requiresReauth,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Connection test API error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}