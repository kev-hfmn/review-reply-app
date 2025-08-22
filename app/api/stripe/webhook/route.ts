import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function for consistent logging
function logWebhookEvent(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] WEBHOOK: ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Define interfaces for stored data
interface StoredSessionData {
  userId: string;
  customerId: string;
}

interface StoredSubscriptionData {
  id: string;
  customer: string;
}

interface SubscriptionRecord {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string;
  created_at: string;
  superseded_by?: string;
  replacement_reason?: string;
}

interface SubscriptionCheckResult {
  hasActive: boolean;
  subscriptionsToReplace: SubscriptionRecord[];
  details: {
    totalFound: number;
    trulyActive: number;
    toReplace: number;
    subscriptions: Array<{
      id: string;
      status: string;
      cancel_at_period_end: boolean;
      current_period_end: string;
      created_at: string;
    }>;
    error?: unknown;
  };
}

// Store both checkout sessions and subscriptions temporarily
const checkoutSessionMap = new Map<string, StoredSessionData>();
const pendingSubscriptions = new Map<string, StoredSubscriptionData>();

// Need to disable body parsing for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

// Enhanced subscription checker with proper cancel_at_period_end handling
async function checkExistingActiveSubscription(customerId: string, userId?: string): Promise<SubscriptionCheckResult> {
  logWebhookEvent('Enhanced subscription check', { customerId, userId });
  
  // Check by customer ID - get ALL active subscriptions
  const { data: existingSubsByCustomer, error: customerError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (customerError) {
    logWebhookEvent('Error checking subscriptions by customer ID', customerError);
    return { 
      hasActive: false, 
      subscriptionsToReplace: [], 
      details: { 
        totalFound: 0,
        trulyActive: 0,
        toReplace: 0,
        subscriptions: [],
        error: customerError 
      } 
    };
  }

  // Also check by user ID if provided
  let existingSubsByUser = null;
  if (userId) {
    const { data, error: userError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (userError) {
      logWebhookEvent('Error checking subscriptions by user ID', userError);
    }
    existingSubsByUser = data;
  }

  // Combine and deduplicate subscriptions
  const allSubscriptions = new Map();
  
  existingSubsByCustomer?.forEach(sub => {
    allSubscriptions.set(sub.stripe_subscription_id, sub);
  });
  
  existingSubsByUser?.forEach(sub => {
    allSubscriptions.set(sub.stripe_subscription_id, sub);
  });

  const subscriptions = Array.from(allSubscriptions.values());
  
  // Find truly active subscriptions (not marked for cancellation and not expired)
  const trulyActiveSubscriptions = subscriptions.filter(sub => {
    const isActive = sub.status === 'active';
    const notCancelled = sub.cancel_at_period_end === false;
    const notExpired = new Date(sub.current_period_end) > new Date();
    return isActive && notCancelled && notExpired;
  });
  
  // Find subscriptions that can be replaced (cancelled or expired)
  const subscriptionsToReplace = subscriptions.filter(sub => {
    const isCancelled = sub.cancel_at_period_end === true;
    const isExpired = new Date(sub.current_period_end) <= new Date();
    return isCancelled || isExpired;
  });
  
  const details = {
    totalFound: subscriptions.length,
    trulyActive: trulyActiveSubscriptions.length,
    toReplace: subscriptionsToReplace.length,
    subscriptions: subscriptions.map(sub => ({
      id: sub.stripe_subscription_id,
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_end: sub.current_period_end,
      created_at: sub.created_at
    }))
  };
  
  logWebhookEvent('Enhanced subscription check results', details);

  return {
    hasActive: trulyActiveSubscriptions.length > 0,
    subscriptionsToReplace,
    details
  };
}

// Subscription replacement logic
async function replaceSubscription(
  oldSubscriptionId: string, 
  newSubscriptionId: string, 
  reason: string
): Promise<boolean> {
  try {
    logWebhookEvent('Replacing subscription', { oldSubscriptionId, newSubscriptionId, reason });
    
    // Mark old subscription as superseded in a transaction
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        superseded_by: newSubscriptionId,
        replacement_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', oldSubscriptionId);
    
    if (updateError) {
      logWebhookEvent('Error marking old subscription as superseded', updateError);
      return false;
    }
    
    // Cancel old subscription on Stripe side if it's still active
    try {
      const oldStripeSubscription = await stripe.subscriptions.retrieve(oldSubscriptionId);
      if (oldStripeSubscription.status === 'active' && !oldStripeSubscription.cancel_at_period_end) {
        await stripe.subscriptions.cancel(oldSubscriptionId);
        logWebhookEvent('Cancelled old Stripe subscription', { oldSubscriptionId });
      }
    } catch (stripeError) {
      logWebhookEvent('Error cancelling old Stripe subscription (may already be cancelled)', stripeError);
    }
    
    return true;
  } catch (error) {
    logWebhookEvent('Error in replaceSubscription', error);
    return false;
  }
}

// Webhook event deduplication
async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_events_processed')
      .select('id')
      .eq('stripe_event_id', eventId)
      .maybeSingle();
    
    return !error && !!data;
  } catch (error) {
    logWebhookEvent('Error checking event deduplication', error);
    return false;
  }
}

// Mark event as processed
async function markEventAsProcessed(
  eventId: string, 
  eventType: string, 
  subscriptionId?: string, 
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabaseAdmin
      .from('webhook_events_processed')
      .insert({
        stripe_event_id: eventId,
        event_type: eventType,
        subscription_id: subscriptionId,
        metadata
      });
  } catch (error) {
    logWebhookEvent('Error marking event as processed', error);
  }
}

// Currently Handled Events:
// 1. checkout.session.completed - When a customer completes checkout
// 2. customer.subscription.created - When a new subscription is created
// 3. customer.subscription.updated - When a subscription is updated
// 4. customer.subscription.deleted - When a subscription is cancelled/deleted
// 5. customer.subscription.pending_update_applied - When a pending update is applied
// 6. customer.subscription.pending_update_expired - When a pending update expires
// 7. customer.subscription.trial_will_end - When a trial is about to end

// Other Important Events You Might Want to Handle:
// Payment Related:
// - invoice.paid - When an invoice is paid successfully
// - invoice.payment_failed - When a payment fails
// - invoice.upcoming - When an invoice is going to be created
// - payment_intent.succeeded - When a payment is successful
// - payment_intent.payment_failed - When a payment fails

// Customer Related:
// - customer.created - When a new customer is created
// - customer.updated - When customer details are updated
// - customer.deleted - When a customer is deleted

// Subscription Related:
// - customer.subscription.paused - When a subscription is paused
// - customer.subscription.resumed - When a subscription is resumed
// - customer.subscription.trial_will_end - 3 days before trial ends

// Checkout Related:
// - checkout.session.async_payment_succeeded - Async payment success
// - checkout.session.async_payment_failed - Async payment failure
// - checkout.session.expired - When checkout session expires

export const POST = withCors(async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  try {
    logWebhookEvent('Received webhook request');
    logWebhookEvent('Stripe signature', sig);

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    logWebhookEvent(`Event received: ${event.type}`, event.data.object);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check for event deduplication first
        const alreadyProcessed = await isEventAlreadyProcessed(event.id);
        if (alreadyProcessed) {
          logWebhookEvent('Event already processed, skipping', { eventId: event.id });
          return NextResponse.json({ status: 'already_processed' });
        }

        // Enhanced subscription check with replacement logic
        const subscriptionCheck = await checkExistingActiveSubscription(
          session.customer as string, 
          session.client_reference_id || undefined
        );

        if (subscriptionCheck.hasActive) {
          logWebhookEvent('Active subscription found, blocking duplicate', subscriptionCheck.details);
          
          // Cancel the new subscription immediately
          if (session.subscription) {
            try {
              await stripe.subscriptions.cancel(session.subscription as string);
              logWebhookEvent('Successfully canceled duplicate subscription', {
                subscriptionId: session.subscription
              });
            } catch (cancelError) {
              logWebhookEvent('Error canceling duplicate subscription', cancelError);
            }
          }
          
          // Mark event as processed even if blocked
          await markEventAsProcessed(event.id, event.type, session.subscription as string, {
            reason: 'blocked_duplicate',
            existingSubscriptions: subscriptionCheck.details.subscriptions
          });

          return NextResponse.json({
            status: 'blocked',
            message: 'Customer already has an active subscription',
            details: subscriptionCheck.details
          });
        }

        // Handle subscription replacement if there are cancelled subscriptions
        if (subscriptionCheck.subscriptionsToReplace.length > 0) {
          logWebhookEvent('Found subscriptions to replace', {
            count: subscriptionCheck.subscriptionsToReplace.length,
            subscriptions: subscriptionCheck.subscriptionsToReplace
          });
          
          for (const oldSub of subscriptionCheck.subscriptionsToReplace) {
            await replaceSubscription(
              oldSub.stripe_subscription_id,
              session.subscription as string,
              'checkout_session_replacement'
            );
          }
        }

        logWebhookEvent('Processing checkout.session.completed', {
          sessionId: session.id,
          clientReferenceId: session.client_reference_id,
          customerId: session.customer,
          subscriptionId: session.subscription
        });

        if (!session.client_reference_id || !session.customer || !session.subscription) {
          logWebhookEvent('Missing required session data', {
            clientReferenceId: session.client_reference_id,
            customerId: session.customer,
            subscriptionId: session.subscription
          });
          return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
        }

        try {
          const subscription = await createSubscription(
            session.subscription as string,
            session.client_reference_id!,
            session.customer as string
          );
          logWebhookEvent('Successfully created subscription', subscription);
          
          // Mark event as processed after successful creation
          await markEventAsProcessed(event.id, event.type, session.subscription as string, {
            userId: session.client_reference_id,
            customerId: session.customer,
            subscriptionId: subscription?.id
          });
        } catch (error) {
          logWebhookEvent('Failed to create subscription', error);
          throw error;
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;

        // Check for event deduplication
        const alreadyProcessed = await isEventAlreadyProcessed(event.id);
        if (alreadyProcessed) {
          logWebhookEvent('Subscription created event already processed', { eventId: event.id });
          return NextResponse.json({ status: 'already_processed' });
        }

        // Enhanced subscription check
        const subscriptionCheck = await checkExistingActiveSubscription(
          subscription.customer as string
        );

        if (subscriptionCheck.hasActive) {
          logWebhookEvent('Duplicate subscription creation blocked', {
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            details: subscriptionCheck.details
          });

          // Cancel this subscription immediately
          try {
            await stripe.subscriptions.cancel(subscription.id);
            logWebhookEvent('Successfully canceled duplicate subscription', {
              subscriptionId: subscription.id
            });
          } catch (cancelError) {
            logWebhookEvent('Error canceling duplicate subscription', cancelError);
          }
          
          // Mark as processed even if blocked
          await markEventAsProcessed(event.id, event.type, subscription.id, {
            reason: 'blocked_duplicate',
            existingSubscriptions: subscriptionCheck.details.subscriptions
          });

          return NextResponse.json({
            status: 'blocked',
            message: 'Customer already has an active subscription'
          });
        }

        // Handle replacement subscriptions
        if (subscriptionCheck.subscriptionsToReplace.length > 0) {
          for (const oldSub of subscriptionCheck.subscriptionsToReplace) {
            await replaceSubscription(
              oldSub.stripe_subscription_id,
              subscription.id,
              'subscription_created_replacement'
            );
          }
        }

        // Check if we have the session data already
        const sessionData = checkoutSessionMap.get(subscription.id);
        if (sessionData) {
          // We can create the subscription now
          await createSubscription(
            subscription.id,
            sessionData.userId,
            sessionData.customerId
          );
          checkoutSessionMap.delete(subscription.id);
          
          // Mark as processed
          await markEventAsProcessed(event.id, event.type, subscription.id, {
            userId: sessionData.userId,
            customerId: sessionData.customerId
          });
        } else {
          // Store the subscription data until we get the session
          pendingSubscriptions.set(subscription.id, {
            id: subscription.id,
            customer: subscription.customer as string
          });
          
          logWebhookEvent('Stored pending subscription, waiting for session data', {
            subscriptionId: subscription.id
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Check for event deduplication
        const alreadyProcessed = await isEventAlreadyProcessed(event.id);
        if (alreadyProcessed) {
          return NextResponse.json({ status: 'already_processed' });
        }

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logWebhookEvent('Error updating subscription', error);
        } else {
          await markEventAsProcessed(event.id, event.type, subscription.id, {
            subscriptionStatus: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Check for event deduplication
        const alreadyProcessed = await isEventAlreadyProcessed(event.id);
        if (alreadyProcessed) {
          return NextResponse.json({ status: 'already_processed' });
        }

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            current_period_end: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logWebhookEvent('Error updating deleted subscription', error);
        } else {
          await markEventAsProcessed(event.id, event.type, subscription.id, {
            reason: 'subscription_deleted'
          });
        }
        break;
      }

      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;

        // Check for event deduplication
        const alreadyProcessed = await isEventAlreadyProcessed(event.id);
        if (alreadyProcessed) {
          return NextResponse.json({ status: 'already_processed' });
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        await markEventAsProcessed(event.id, event.type, subscription.id);
        break;
      }

      // Note: You might want to add handlers for these common events:
      // case 'invoice.paid': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   // Handle successful payment
      // }

      // case 'invoice.payment_failed': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   // Handle failed payment, notify user
      // }

      // case 'customer.subscription.trial_will_end': {
      //   const subscription = event.data.object as Stripe.Subscription;
      //   // Notify user about trial ending
      // }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logWebhookEvent('Webhook error', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
});

function getPlanFromPriceId(priceId: string | undefined): string {
  if (!priceId) return 'starter'; // Default fallback
  
  // Map Stripe price IDs to plan names
  const priceIdToPlan: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '']: 'starter',
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '']: 'pro',
    [process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID || '']: 'pro_plus'
  };
  
  return priceIdToPlan[priceId] || 'starter'; // Default to starter if not found
}

async function createSubscription(subscriptionId: string, userId: string, customerId: string) {
  logWebhookEvent('Starting createSubscription', { subscriptionId, userId, customerId });

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    logWebhookEvent('Retrieved Stripe subscription', stripeSubscription);

    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId);

    if (checkError) {
      logWebhookEvent('Error checking existing subscription', checkError);
    }

    if (existingData && existingData.length > 0) {
      logWebhookEvent('Found existing subscription', existingData[0]);
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (updateError) {
        logWebhookEvent('Error updating existing subscription', updateError);
        throw updateError;
      }
      return existingData[0];
    }

    logWebhookEvent('Creating new subscription record');
    const { data, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: stripeSubscription.status,
        plan_id: getPlanFromPriceId(stripeSubscription.items.data[0]?.price.id),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: stripeSubscription.items.data[0]?.price.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      logWebhookEvent('Error inserting new subscription', insertError);
      throw insertError;
    }

    logWebhookEvent('Successfully created new subscription', data);
    return data?.[0];
  } catch (error) {
    logWebhookEvent('Error in createSubscription', error);
    throw error;
  }
}
