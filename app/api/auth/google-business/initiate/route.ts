import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { generateAuthUrl, generateSecureState } from '@/lib/services/googleOAuthService';

/**
 * Initiate Google Business Profile OAuth flow with platform credentials
 * POST /api/auth/google-business/initiate
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists in auth system
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate secure state parameter for CSRF protection (businessId is now placeholder)
    const state = generateSecureState('placeholder', userId);
    
    // Generate OAuth authorization URL
    const authUrl = generateAuthUrl(state);

    console.log('🚀 Generated OAuth URL for user:', userId);

    return NextResponse.json({
      authUrl,
      message: 'OAuth flow initiated successfully'
    });

  } catch (error) {
    console.error('❌ OAuth initiation failed:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}