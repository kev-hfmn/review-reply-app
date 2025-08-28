import { supabaseAdmin } from '@/utils/supabase-admin';
import { PLAN_CONFIGS, PlanId } from '@/lib/config/plans';

export interface SubscriptionStatus {
  isSubscriber: boolean;
  subscription: any | null;
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
    const isPaidPlan = subscription.plan_id !== 'basic';
    const isWithinPeriod = new Date(subscription.current_period_end) > new Date();

    // Only consider users with active status AND paid plans as subscribers
    const isSubscriber = isActiveSubscription && isPaidPlan && isWithinPeriod;
    const isBasic = subscription.plan_id === 'basic';

    return {
      isSubscriber,
      subscription,
      planId: subscription.plan_id,
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
