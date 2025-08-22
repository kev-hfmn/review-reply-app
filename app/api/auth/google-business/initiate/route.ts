import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { generateAuthUrl, generateSecureState } from '@/lib/services/googleOAuthService';

/**
 * Initiate Google Business Profile OAuth flow with platform credentials
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

    // Update connection attempt timestamp
    await supabaseAdmin
      .from('businesses')
      .update({ 
        last_connection_attempt: new Date().toISOString(),
        connection_status: 'connecting'
      })
      .eq('id', businessId);

    const state = generateSecureState(businessId, userId);
    const authUrl = generateAuthUrl(state);

    console.log('🚀 Initiating platform OAuth flow for business:', businessId);

    return NextResponse.json({
      authUrl,
      message: 'OAuth URL generated successfully with platform credentials',
    });

  } catch (error) {
    console.error('❌ OAuth initiate error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}