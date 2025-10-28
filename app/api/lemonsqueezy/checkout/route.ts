import { NextRequest, NextResponse } from 'next/server';
import { LemonSqueezyService } from '@/lib/services/lemonSqueezyService';

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to avoid environment variable loading issues
    const { supabaseAdmin } = await import('@/utils/supabase-admin');
    const { variantId, userId, customData, quantity = 1 } = await request.json();

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
    } 
    
    // Handle existing subscription - upgrade/change plan instead of blocking
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const activeSubscription = existingSubscriptions[0];
      if (new Date(activeSubscription.current_period_end) > new Date()) {
        console.log('Existing subscription found, attempting plan update...', {
          currentPlan: activeSubscription.plan_id,
          newVariantId: variantId,
          quantity,
          subscriptionId: activeSubscription.lemonsqueezy_subscription_id,
          subscriptionKeys: Object.keys(activeSubscription)
        });
        
        // Determine if we should update subscription or create new checkout
        // Always create new checkout for Pro Plus with multiple businesses (graduated pricing limitation)
        const shouldCreateNewCheckout =
          !activeSubscription.lemonsqueezy_subscription_id || // No LS subscription ID
          (customData?.planId === 'pro-plus' && quantity > 1); // Pro Plus with multiple businesses

        if (shouldCreateNewCheckout) {
          const reason = !activeSubscription.lemonsqueezy_subscription_id
            ? 'No Lemon Squeezy subscription ID found'
            : 'Pro Plus with graduated pricing requires new checkout';
          console.log(`${reason} - creating new checkout instead of updating:`, activeSubscription.id);
          // Fall through to create new checkout session
        } else {
          // Use subscription update for simple plan changes (e.g., Starter → Pro)
          // Get product_id from environment variable based on plan
          const productId = customData?.planId === 'pro-plus'
            ? '621379' // Pro Plus product ID
            : undefined; // Let Lemon Squeezy infer product for same-product upgrades

          const { data: updatedSubscription, error: updateError } = await LemonSqueezyService.updateSubscription(
            activeSubscription.lemonsqueezy_subscription_id,
            {
              productId,
              variantId: variantId,
              // For Pro Plus with quantity > 1, this handles graduated pricing
              quantity: quantity > 1 ? quantity : undefined,
            }
          );

          if (updateError) {
            console.error('Subscription update failed:', updateError);
            return NextResponse.json(
              { error: `Failed to update subscription: ${updateError}` },
              { status: 500 }
            );
          }

          if (!updatedSubscription) {
            return NextResponse.json(
              { error: 'Subscription update returned no data' },
              { status: 500 }
            );
          }

          // Update local database with new subscription details
          // Derive plan_id from customData (passed from frontend)
          const newPlanId = customData?.planId || activeSubscription.plan_id;

          const { error: dbUpdateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              lemonsqueezy_variant_id: variantId,
              plan_id: newPlanId,
              updated_at: new Date().toISOString()
            })
            .eq('id', activeSubscription.id);

          if (dbUpdateError) {
            console.error('Failed to update local subscription record:', dbUpdateError);
            // Note: Don't return error here as Lemon Squeezy update succeeded
          }

          console.log('Subscription updated successfully:', {
            subscriptionId: activeSubscription.lemonsqueezy_subscription_id,
            userId,
            newVariantId: variantId,
            quantity
          });

          // Return success response with plan change confirmation
          return NextResponse.json({
            success: true,
            action: 'subscription_updated',
            subscriptionId: activeSubscription.lemonsqueezy_subscription_id,
            message: 'Subscription plan updated successfully'
          });
        }
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
      quantity,
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