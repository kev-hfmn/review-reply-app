import { 
  lemonSqueezySetup, 
  createCheckout,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  getCustomer,
  type Checkout,
  type Subscription,
  type Customer,
} from '@lemonsqueezy/lemonsqueezy.js';

// Initialize Lemon Squeezy SDK
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('Lemon Squeezy API Error:', error),
});

export interface CheckoutOptions {
  variantId: string;
  userId: string;
  userEmail: string;
  redirectUrl?: string;
  customData?: Record<string, any>;
}

export interface CheckoutResponse {
  url: string;
  id: string;
}

export class LemonSqueezyService {
  /**
   * Create a new checkout session for a subscription
   */
  static async createCheckout(options: CheckoutOptions): Promise<{ data?: CheckoutResponse; error?: string }> {
    try {
      const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
      
      if (!storeId) {
        throw new Error('LEMONSQUEEZY_STORE_ID environment variable is not set');
      }

      // Debug logging
      console.log('Creating Lemon Squeezy checkout with:', {
        storeId,
        variantId: options.variantId,
        userId: options.userId,
        userEmail: options.userEmail
      });

      // Use the simplified SDK approach - just pass the required params
      console.log('Calling createCheckout with storeId:', storeId, 'variantId:', options.variantId);
      
      const { data, error } = await createCheckout(storeId, options.variantId, {
        checkoutData: {
          email: options.userEmail,
          custom: {
            user_id: options.userId,
          },
        },
        productOptions: {
          redirectUrl: options.redirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/profile?payment=success`,
        },
      });

      if (error) {
        console.error('Lemon Squeezy checkout creation error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        
        // Try to get more specific error information
        if (error.cause && Array.isArray(error.cause)) {
          console.error('Error cause details:', error.cause);
        }
        
        return { error: `Lemon Squeezy API Error: ${error.message}` };
      }

      if (!data?.data?.attributes?.url) {
        return { error: 'No checkout URL returned from Lemon Squeezy' };
      }

      return {
        data: {
          url: data.data.attributes.url,
          id: data.data.id,
        },
      };
    } catch (error) {
      console.error('Error in createCheckout:', error);
      return { error: 'Failed to create checkout session' };
    }
  }

  /**
   * Retrieve subscription details from Lemon Squeezy
   */
  static async getSubscriptionDetails(subscriptionId: string): Promise<{ data?: Subscription; error?: string }> {
    try {
      const { data, error } = await getSubscription(subscriptionId);

      if (error) {
        console.error('Error retrieving subscription:', error);
        return { error: 'Failed to retrieve subscription details' };
      }

      return { data: data?.data };
    } catch (error) {
      console.error('Error in getSubscriptionDetails:', error);
      return { error: 'Failed to retrieve subscription details' };
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<{ data?: Subscription; error?: string }> {
    try {
      const { data, error } = await cancelSubscription(subscriptionId);

      if (error) {
        console.error('Error canceling subscription:', error);
        return { error: 'Failed to cancel subscription' };
      }

      return { data: data?.data };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return { error: 'Failed to cancel subscription' };
    }
  }

  /**
   * Update a subscription (change plan, billing anchor, etc.)
   */
  static async updateSubscription(
    subscriptionId: string, 
    updateData: {
      variantId?: string;
      billingAnchor?: number;
      trialEndsAt?: string;
      pause?: { mode: 'void' | 'free'; resumesAt?: string } | null;
    }
  ): Promise<{ data?: Subscription; error?: string }> {
    try {
      const { data, error } = await updateSubscription(subscriptionId, {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          variant_id: updateData.variantId ? parseInt(updateData.variantId) : undefined,
          billing_anchor: updateData.billingAnchor,
          trial_ends_at: updateData.trialEndsAt,
          pause: updateData.pause ? {
            mode: updateData.pause.mode,
            resumes_at: updateData.pause.resumesAt,
          } : updateData.pause,
        },
      });

      if (error) {
        console.error('Error updating subscription:', error);
        return { error: 'Failed to update subscription' };
      }

      return { data: data?.data };
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return { error: 'Failed to update subscription' };
    }
  }

  /**
   * Get customer details
   */
  static async getCustomerDetails(customerId: string): Promise<{ data?: Customer; error?: string }> {
    try {
      const { data, error } = await getCustomer(customerId);

      if (error) {
        console.error('Error retrieving customer:', error);
        return { error: 'Failed to retrieve customer details' };
      }

      return { data: data?.data };
    } catch (error) {
      console.error('Error in getCustomerDetails:', error);
      return { error: 'Failed to retrieve customer details' };
    }
  }

  /**
   * Generate customer portal URL for subscription management
   * Note: Lemon Squeezy provides built-in portal URLs in subscription objects
   */
  static getCustomerPortalUrl(subscription: any): string | null {
    return subscription?.attributes?.urls?.customer_portal || null;
  }

  /**
   * Generate update payment method URL
   * Note: Lemon Squeezy provides built-in URLs in subscription objects
   */
  static getUpdatePaymentMethodUrl(subscription: any): string | null {
    return subscription?.attributes?.urls?.update_payment_method || null;
  }

  /**
   * Validate webhook signature
   */
  static validateWebhookSignature(body: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
      
      if (!webhookSecret) {
        console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
        return false;
      }

      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(body);
      const expectedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'), 
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Parse custom data from webhook event
   */
  static parseCustomData(event: any): Record<string, any> | null {
    try {
      return event?.meta?.custom_data || null;
    } catch (error) {
      console.error('Error parsing custom data:', error);
      return null;
    }
  }

  /**
   * Check if subscription is truly active (not cancelled or past due)
   */
  static isSubscriptionActive(subscription: any): boolean {
    if (!subscription?.attributes) return false;
    
    const status = subscription.attributes.status;
    const cancelled = subscription.attributes.cancelled;
    const endsAt = subscription.attributes.ends_at;
    
    // Active if status is 'active' and not cancelled, or still within grace period
    if (status === 'active' && !cancelled) {
      return true;
    }
    
    // Also consider 'on_trial' as active
    if (status === 'on_trial') {
      return true;
    }
    
    // If cancelled but still within the period, consider it active
    if (status === 'active' && cancelled && endsAt) {
      return new Date(endsAt) > new Date();
    }
    
    return false;
  }

  /**
   * Get subscription status for display
   */
  static getSubscriptionStatusDisplay(subscription: any): string {
    if (!subscription?.attributes) return 'Unknown';
    
    const status = subscription.attributes.status;
    const cancelled = subscription.attributes.cancelled;
    
    if (status === 'on_trial') return 'Trial';
    if (status === 'active' && !cancelled) return 'Active';
    if (status === 'active' && cancelled) return 'Cancelled (Active until period end)';
    if (status === 'past_due') return 'Past Due';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'expired') return 'Expired';
    if (status === 'paused') return 'Paused';
    
    return status || 'Unknown';
  }
}