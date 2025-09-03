import { supabaseAdmin } from '@/utils/supabase-admin';
import { PLAN_CONFIGS, PlanId } from '@/lib/config/plans';

export interface SubscriptionStatus {
  isSubscriber: boolean;
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  planId: string;
  status: string;
  isBasic: boolean;
  isPaid: boolean;
}

/**
 * Centralized subscription checking logic
 * Returns consistent subscription status across the app
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionStatus> {
  try {
    // Validate user ID
    if (!userId || userId.length < 10) {
      return {
        isSubscriber: false,
        subscription: null,
        planId: 'basic',
        status: 'free',
        isBasic: true,
        isPaid: false
      };
    }

    // Get the most recent subscription for this user
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Subscription check error:', error);
      return {
        isSubscriber: false,
        subscription: null,
        planId: 'basic',
        status: 'error',
        isBasic: true,
        isPaid: false
      };
    }

    // Determine subscription status
    // With the new system: 'active' = paying customer, 'free' = basic user
    const isActiveSubscription = subscription.status === 'active';
    // Use plan_id from database
    const planId = subscription.plan_id || 'basic';
    const isPaidPlan = planId !== 'basic';
    const isWithinPeriod = new Date(subscription.current_period_end) > new Date();

    // Only consider users with active status AND paid plans as subscribers
    const isSubscriber = isActiveSubscription && isPaidPlan && isWithinPeriod;
    const isBasic = planId === 'basic';

    return {
      isSubscriber,
      subscription,
      planId: planId,
      status: subscription.status,
      isBasic,
      isPaid: isPaidPlan
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      isSubscriber: false,
      subscription: null,
      planId: 'basic',
      status: 'error',
      isBasic: true,
      isPaid: false
    };
  }
}

/**
 * Get user display status for UI
 */
export function getUserDisplayStatus(subscriptionStatus: SubscriptionStatus): string {
  if (subscriptionStatus.isSubscriber) {
    const planName = subscriptionStatus.planId.replace('-', ' ');
    return `${planName.charAt(0).toUpperCase() + planName.slice(1)} User`;
  }
  return 'Basic User';
}

/**
 * Check if user has access to premium features
 */
export function hasFeatureAccess(subscriptionStatus: SubscriptionStatus, feature: string): boolean {
  // Basic features available to all users
  const basicFeatures = ['dashboard', 'settings', 'profile'];

  if (basicFeatures.includes(feature)) {
    return true;
  }

  // Premium features require subscription
  const premiumFeatures = ['ai-insights', 'auto-replies', 'advanced-sync'];

  if (premiumFeatures.includes(feature)) {
    return subscriptionStatus.isSubscriber;
  }

  return false;
}

// NEW FUNCTIONS FOR PLAN RESTRICTIONS

/**
 * Get plan configuration based on plan ID
 */
export function getPlanConfig(planId: string) {
  const plan = planId?.toLowerCase().replace('_', '-') || 'basic';
  return PLAN_CONFIGS[plan as PlanId] || PLAN_CONFIGS.basic;
}

/**
 * Check if a specific feature is allowed for a plan
 */
export function hasFeature(planId: string, feature: keyof typeof PLAN_CONFIGS.basic.features): boolean {
  const config = getPlanConfig(planId);
  return config.features[feature] === true;
}

/**
 * Get a specific limit value for a plan
 */
export function getPlanLimit(planId: string, limit: keyof typeof PLAN_CONFIGS.basic.limits): number | string {
  const config = getPlanConfig(planId);
  return config.limits[limit];
}

/**
 * Get current usage for a user's billing period
 */
export async function getCurrentUsage(userId: string, businessId: string): Promise<{
  repliesPosted: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}> {
  try {
    // Get current subscription to determine billing period
    const subscription = await checkUserSubscription(userId);
    if (!subscription.subscription) {
      return { repliesPosted: 0, billingPeriodStart: '', billingPeriodEnd: '' };
    }

    const currentPeriodEnd = subscription.subscription.current_period_end;
    // Calculate billing period start (30 days before end)
    const billingPeriodEnd = new Date(currentPeriodEnd);
    const billingPeriodStart = new Date(billingPeriodEnd);
    billingPeriodStart.setDate(billingPeriodStart.getDate() - 30);

    // Get or create usage record for current billing period
    const { data: usage, error } = await supabaseAdmin
      .from('subscription_usage')
      .select('replies_posted, billing_period_start, billing_period_end')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('billing_period_start', billingPeriodStart.toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error fetching usage:', error);
      return { repliesPosted: 0, billingPeriodStart: '', billingPeriodEnd: '' };
    }

    if (!usage) {
      // Create new usage record for this billing period
      const { data: newUsage, error: createError } = await supabaseAdmin
        .from('subscription_usage')
        .insert({
          user_id: userId,
          business_id: businessId,
          billing_period_start: billingPeriodStart.toISOString(),
          billing_period_end: billingPeriodEnd.toISOString(),
          replies_posted: 0
        })
        .select('replies_posted, billing_period_start, billing_period_end')
        .single();

      if (createError) {
        console.error('Error creating usage record:', createError);
        return { repliesPosted: 0, billingPeriodStart: '', billingPeriodEnd: '' };
      }

      return {
        repliesPosted: newUsage.replies_posted,
        billingPeriodStart: newUsage.billing_period_start,
        billingPeriodEnd: newUsage.billing_period_end
      };
    }

    return {
      repliesPosted: usage.replies_posted,
      billingPeriodStart: usage.billing_period_start,
      billingPeriodEnd: usage.billing_period_end
    };
  } catch (error) {
    console.error('Error in getCurrentUsage:', error);
    return { repliesPosted: 0, billingPeriodStart: '', billingPeriodEnd: '' };
  }
}

/**
 * Check if user can post more replies within their plan limit
 */
export async function checkReplyLimit(userId: string, businessId: string, planId: string): Promise<{
  canPost: boolean;
  currentUsage: number;
  limit: number;
  message?: string;
}> {
  try {
    const limit = getPlanLimit(planId, 'maxRepliesPerMonth') as number;
    
    // If unlimited (-1), always allow
    if (limit === -1) {
      return { canPost: true, currentUsage: 0, limit: -1 };
    }

    // If no replies allowed (0), block
    if (limit === 0) {
      return {
        canPost: false,
        currentUsage: 0,
        limit: 0,
        message: 'Reply posting requires a paid subscription plan.'
      };
    }

    const usage = await getCurrentUsage(userId, businessId);
    const canPost = usage.repliesPosted < limit;

    return {
      canPost,
      currentUsage: usage.repliesPosted,
      limit,
      message: canPost ? undefined : `You have reached your monthly limit of ${limit} replies. Upgrade your plan to post more replies.`
    };
  } catch (error) {
    console.error('Error in checkReplyLimit:', error);
    return {
      canPost: false,
      currentUsage: 0,
      limit: 0,
      message: 'Error checking reply limit. Please try again.'
    };
  }
}

/**
 * Increment reply count for current billing period
 */
export async function incrementReplyCount(userId: string, businessId: string): Promise<boolean> {
  try {
    // Get current usage to ensure record exists
    await getCurrentUsage(userId, businessId);

    // Get current subscription to determine billing period
    const subscription = await checkUserSubscription(userId);
    if (!subscription.subscription) {
      return false;
    }

    const currentPeriodEnd = subscription.subscription.current_period_end;
    const billingPeriodEnd = new Date(currentPeriodEnd);
    const billingPeriodStart = new Date(billingPeriodEnd);
    billingPeriodStart.setDate(billingPeriodStart.getDate() - 30);

    // Increment the counter atomically using RPC function
    const { error } = await supabaseAdmin.rpc('increment_reply_count', {
      p_user_id: userId,
      p_business_id: businessId,
      p_billing_period_start: billingPeriodStart.toISOString()
    });

    if (error) {
      console.error('Error incrementing reply count:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in incrementReplyCount:', error);
    return false;
  }
}

/**
 * Check if current usage is within plan limits
 */
export function isWithinLimit(current: number, planId: string, limit: keyof typeof PLAN_CONFIGS.basic.limits): boolean {
  const maxLimit = getPlanLimit(planId, limit);
  if (maxLimit === -1) return true; // Unlimited
  if (typeof maxLimit === 'number') {
    return current < maxLimit;
  }
  return false;
}
