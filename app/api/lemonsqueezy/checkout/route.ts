import { NextRequest, NextResponse } from 'next/server';
import { LemonSqueezyService } from '@/lib/services/lemonSqueezyService';

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to avoid environment variable loading issues
    const { supabaseAdmin } = await import('@/utils/supabase-admin');
    const { variantId, userId, customData } = await request.json();

    // Validate required parameters
    if (!variantId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: variantId and userId are required' }, 
        { status: 400 }
      );
    }

    // Get user email from Supabase
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const { data: existingSubscriptions, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('cancel_at_period_end', false);

    if (subscriptionError) {
      console.error('Error checking existing subscriptions:', subscriptionError);
    } else if (existingSubscriptions && existingSubscriptions.length > 0) {
      // User already has an active subscription
      const activeSubscription = existingSubscriptions[0];
      if (new Date(activeSubscription.current_period_end) > new Date()) {
        return NextResponse.json(
          { error: 'User already has an active subscription' }, 
          { status: 409 }
        );
      }
    }

    // Create checkout session using LemonSqueezyService
    const { data: checkout, error: checkoutError } = await LemonSqueezyService.createCheckout({
      variantId,
      userId,
      userEmail: user.user.email,
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?payment=success&source=lemonsqueezy`,
      customData: {
        source: 'replifast_app',
        timestamp: new Date().toISOString(),
        ...customData,
      },
    });

    if (checkoutError || !checkout) {
      console.error('Checkout creation failed:', checkoutError);
      return NextResponse.json(
        { error: checkoutError || 'Failed to create checkout session' }, 
        { status: 500 }
      );
    }

    // Log checkout creation for audit trail
    console.log('Lemon Squeezy checkout created:', {
      userId,
      variantId,
      checkoutId: checkout.id,
      userEmail: user.user.email,
    });

    return NextResponse.json({
      url: checkout.url,
      checkoutId: checkout.id,
    });

  } catch (error) {
    console.error('Error in Lemon Squeezy checkout route:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating checkout session' }, 
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}