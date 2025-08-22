import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LemonSqueezyService } from '@/lib/services/lemonSqueezyService';
import { supabaseAdmin } from '@/utils/supabase-admin';

// Event deduplication functions
async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('lemonsqueezy_webhook_events_processed')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();
    
    return !!data;
  } catch (error) {
    console.error('Error checking event processing status:', error);
    return false; // In case of error, allow processing to avoid losing events
  }
}

async function markEventAsProcessed(
  eventId: string, 
  eventName: string, 
  subscriptionId?: string,
  metadata?: any
): Promise<void> {
  try {
    await supabaseAdmin
      .from('lemonsqueezy_webhook_events_processed')
      .insert({
        event_id: eventId,
        event_name: eventName,
        subscription_id: subscriptionId,
        metadata,
      });
  } catch (error) {
    console.error('Error marking event as processed:', error);
    // Don't throw here to avoid breaking the webhook processing
  }
}

// Helper function to check for existing subscription
async function checkExistingSubscription(userId: string, lemonsqueezySubscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('lemonsqueezy_subscription_id', lemonsqueezySubscriptionId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking existing subscription:', error);
  }

  return data;
}

// Helper function to get subscription by Lemon Squeezy ID
async function getSubscriptionByLemonSqueezyId(lemonsqueezySubscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('lemonsqueezy_subscription_id', lemonsqueezySubscriptionId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting subscription by Lemon Squeezy ID:', error);
  }

  return data;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-signature');

  // Validate webhook signature
  if (!signature || !LemonSqueezyService.validateWebhookSignature(body, signature)) {
    console.error('Invalid webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const { meta, data } = event;

    if (!meta?.event_name || !data?.id) {
      console.error('Invalid webhook event structure:', { meta, data });
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    const eventId = `${meta.event_name}_${data.id}`;

    // Check for event deduplication
    if (await isEventAlreadyProcessed(eventId)) {
      console.log('Event already processed:', eventId);
      return NextResponse.json({ status: 'already_processed' });
    }

    console.log('Processing Lemon Squeezy webhook event:', meta.event_name, data.id);

    // Process different event types
    switch (meta.event_name) {
      case 'subscription_created': {
        const subscription = data;
        const customData = LemonSqueezyService.parseCustomData(event);
        
        if (!customData?.user_id) {
          console.error('No user_id in subscription custom data:', customData);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'No user_id' });
          return NextResponse.json({ error: 'No user_id in custom data' }, { status: 400 });
        }

        // Check if subscription already exists
        const existingSubscription = await checkExistingSubscription(customData.user_id, subscription.id);
        if (existingSubscription) {
          console.log('Subscription already exists, skipping creation:', subscription.id);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { skipped: 'already_exists' });
          return NextResponse.json({ status: 'subscription_already_exists' });
        }

        // Create subscription record
        const subscriptionData = {
          user_id: customData.user_id,
          lemonsqueezy_subscription_id: subscription.id.toString(),
          lemonsqueezy_customer_id: subscription.attributes.customer_id?.toString(),
          lemonsqueezy_order_id: subscription.attributes.order_id?.toString(),
          lemonsqueezy_variant_id: subscription.attributes.variant_id?.toString(),
          lemonsqueezy_product_id: subscription.attributes.product_id?.toString(),
          status: subscription.attributes.status,
          payment_processor: 'lemonsqueezy',
          cancel_at_period_end: subscription.attributes.cancelled || false,
          // Fix date mapping - use renews_at for current period end, and created_at for start
          current_period_start: subscription.attributes.created_at,
          current_period_end: subscription.attributes.renews_at || subscription.attributes.ends_at,
        };

        console.log('Attempting to create subscription with data:', JSON.stringify(subscriptionData, null, 2));

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .insert(subscriptionData);

        if (error) {
          console.error('Error creating subscription:', error);
          console.error('Failed subscription data:', subscriptionData);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'database_insert_failed', details: error });
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }

        console.log('Subscription created successfully:', subscription.id);
        break;
      }

      case 'subscription_updated': {
        const subscription = data;
        
        const existingSubscription = await getSubscriptionByLemonSqueezyId(subscription.id);
        if (!existingSubscription) {
          console.error('Subscription not found for update:', subscription.id);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'subscription_not_found' });
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const updateData = {
          status: subscription.attributes.status,
          cancel_at_period_end: subscription.attributes.cancelled || false,
          current_period_start: subscription.attributes.created_at,
          current_period_end: subscription.attributes.renews_at || subscription.attributes.ends_at,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('lemonsqueezy_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        console.log('Subscription updated successfully:', subscription.id);
        break;
      }

      case 'subscription_cancelled': {
        const subscription = data;
        
        const existingSubscription = await getSubscriptionByLemonSqueezyId(subscription.id);
        if (!existingSubscription) {
          console.error('Subscription not found for cancellation:', subscription.id);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'subscription_not_found' });
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const updateData = {
          status: 'cancelled',
          cancel_at_period_end: false,
          current_period_end: subscription.attributes.ends_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('lemonsqueezy_subscription_id', subscription.id);

        if (error) {
          console.error('Error canceling subscription:', error);
          return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
        }

        console.log('Subscription cancelled successfully:', subscription.id);
        break;
      }

      case 'subscription_resumed': {
        const subscription = data;
        
        const existingSubscription = await getSubscriptionByLemonSqueezyId(subscription.id);
        if (!existingSubscription) {
          console.error('Subscription not found for resume:', subscription.id);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'subscription_not_found' });
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const updateData = {
          status: subscription.attributes.status,
          cancel_at_period_end: false,
          current_period_start: subscription.attributes.created_at,
          current_period_end: subscription.attributes.renews_at || subscription.attributes.ends_at,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('lemonsqueezy_subscription_id', subscription.id);

        if (error) {
          console.error('Error resuming subscription:', error);
          return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
        }

        console.log('Subscription resumed successfully:', subscription.id);
        break;
      }

      case 'subscription_expired': {
        const subscription = data;
        
        const existingSubscription = await getSubscriptionByLemonSqueezyId(subscription.id);
        if (!existingSubscription) {
          console.error('Subscription not found for expiration:', subscription.id);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'subscription_not_found' });
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const updateData = {
          status: 'expired',
          cancel_at_period_end: false,
          current_period_end: subscription.attributes.ends_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('lemonsqueezy_subscription_id', subscription.id);

        if (error) {
          console.error('Error expiring subscription:', error);
          return NextResponse.json({ error: 'Failed to expire subscription' }, { status: 500 });
        }

        console.log('Subscription expired successfully:', subscription.id);
        break;
      }

      case 'subscription_paused':
      case 'subscription_unpaused': {
        const subscription = data;
        
        const existingSubscription = await getSubscriptionByLemonSqueezyId(subscription.id);
        if (!existingSubscription) {
          console.error('Subscription not found for pause/unpause:', subscription.id);
          await markEventAsProcessed(eventId, meta.event_name, subscription.id, { error: 'subscription_not_found' });
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const updateData = {
          status: subscription.attributes.status,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('lemonsqueezy_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription pause status:', error);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        console.log(`Subscription ${meta.event_name.replace('subscription_', '')} successfully:`, subscription.id);
        break;
      }

      case 'subscription_payment_success':
      case 'subscription_payment_failed':
      case 'subscription_payment_recovered':
      case 'subscription_payment_refunded': {
        // These are subscription invoice events, we can log them for analytics
        console.log(`Payment event: ${meta.event_name}`, {
          subscriptionId: data.attributes?.subscription_id,
          status: data.attributes?.status,
          total: data.attributes?.total,
          currency: data.attributes?.currency,
        });
        break;
      }

      case 'order_created':
      case 'order_refunded': {
        // Order events - we can log these for analytics
        console.log(`Order event: ${meta.event_name}`, {
          orderId: data.id,
          customerId: data.attributes?.customer_id,
          total: data.attributes?.total,
          currency: data.attributes?.currency,
        });
        break;
      }

      case 'license_key_created':
      case 'license_key_updated': {
        // License key events - not currently used but we can log them
        console.log(`License key event: ${meta.event_name}`, {
          licenseKeyId: data.id,
          orderId: data.attributes?.order_id,
        });
        break;
      }

      default: {
        console.log('Unhandled webhook event:', meta.event_name);
      }
    }

    // Mark event as processed
    await markEventAsProcessed(eventId, meta.event_name, data.id, event);

    return NextResponse.json({ received: true, processed: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
    },
  });
}