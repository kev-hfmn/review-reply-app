import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LemonSqueezyService } from '@/lib/services/lemonSqueezyService';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Reactivate the subscription with Lemon Squeezy by removing the cancellation
    // This is done by updating the subscription to remove the pause/cancellation
    const { data: reactivatedSubscription, error } = await LemonSqueezyService.updateSubscription(subscriptionId, {
      pause: null, // Remove any pause
    });

    if (error) {
      console.error('Error reactivating Lemon Squeezy subscription:', error);
      return NextResponse.json({ error: 'Failed to reactivate subscription' }, { status: 500 });
    }

    // Update the subscription status in our database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('lemonsqueezy_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      subscription: reactivatedSubscription 
    });

  } catch (error) {
    console.error('Error in reactivate subscription route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}