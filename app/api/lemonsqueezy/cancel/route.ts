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

    // Cancel the subscription with Lemon Squeezy
    const { data: canceledSubscription, error } = await LemonSqueezyService.cancelSubscription(subscriptionId);

    if (error) {
      console.error('Error canceling Lemon Squeezy subscription:', error);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    // Update the subscription status in our database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('lemonsqueezy_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      subscription: canceledSubscription 
    });

  } catch (error) {
    console.error('Error in cancel subscription route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}