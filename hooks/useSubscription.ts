'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionQuery, useSubscriptionInvalidation } from '@/hooks/queries/useSubscriptionQuery';
import debounce from 'lodash/debounce';

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  lemonsqueezy_subscription_id?: string;
  lemonsqueezy_customer_id?: string;
  payment_processor?: string;
  plan_id?: string;
  cancel_at_period_end: boolean;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  
  // NEW: Use centralized query instead of direct Supabase
  const subscriptionQuery = useSubscriptionQuery(user?.id || null);
  const { invalidateSubscription } = useSubscriptionInvalidation();
  
  // Keep local state for backward compatibility but sync with cache
  const [error, setError] = useState<string | null>(null);

  // Sync cache errors with local state for backward compatibility
  useEffect(() => {
    if (subscriptionQuery.error) {
      setError(subscriptionQuery.error.message || 'Failed to load subscription');
    } else {
      setError(null);
    }
  }, [subscriptionQuery.error]);

  // Remove old fetchSubscription useEffect - handled by centralized cache

  // Remove checkValidSubscription - handled by centralized API logic

  const MAX_SYNC_RETRIES = 3;
  const [syncRetries, setSyncRetries] = useState(0);

  const debouncedSyncWithStripe = useCallback(
    debounce(async (subscriptionId: string) => {
      if (syncRetries >= MAX_SYNC_RETRIES) {
        console.log('Max sync retries reached');
        return;
      }

      try {
        const response = await fetch('/api/stripe/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to sync with Stripe');
        }
        
        // Invalidate cache instead of direct fetch
        if (user?.id) {
          invalidateSubscription(user.id);
        }
        setSyncRetries(0); // Reset retries on success
      } catch (error) {
        console.error('Error syncing with Stripe:', error);
        setError(error instanceof Error ? error.message : 'Failed to sync with Stripe');
        setSyncRetries(prev => prev + 1);
      }
    }, 30000), // 30 second delay between calls
    [invalidateSubscription, user?.id, syncRetries]
  );

  const syncWithStripe = useCallback((subscriptionId: string) => {
    debouncedSyncWithStripe(subscriptionId);
  }, [debouncedSyncWithStripe]);

  // Remove real-time listener - cache handles updates and prevents conflicts

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = subscriptionQuery.data?.subscription;
    
    if (subscription?.stripe_subscription_id) {
      // Add a delay before first sync
      timeoutId = setTimeout(() => {
        syncWithStripe(subscription.stripe_subscription_id);
      }, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [syncWithStripe, subscriptionQuery.data?.subscription?.stripe_subscription_id]);

  return {
    subscription: subscriptionQuery.data?.subscription || null,
    isLoading: subscriptionQuery.isLoading,
    error,
    syncWithStripe: useCallback((subscriptionId: string) => {
      debouncedSyncWithStripe(subscriptionId);
    }, [debouncedSyncWithStripe]),
    fetchSubscription: subscriptionQuery.refetch // Use cache refetch instead
  };
} 