'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { AccountManagement } from '@/components/AccountManagement';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ProfilePricingSection } from '@/components/ProfilePricingSection';
import { PromoCodeBanner } from '@/components/PromoCodeBanner';
import ToastNotifications from '@/components/ToastNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import type { ToastNotification } from '@/types/reviews';
import { Button } from '@/components/ui/button';

function getPlanFromSubscription(subscription: any): string {
  // Primary: Use plan_id if available
  if (subscription?.plan_id) {
    return subscription.plan_id;
  }

  // Fallback: Use status field
  if (subscription?.status) {
    return subscription.status;
  }

  // Legacy: If subscription has a plan_name field, use it
  if (subscription?.plan_name) {
    return subscription.plan_name;
  }

  return 'basic';
}

function formatSubscriptionDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                day === 2 || day === 22 ? 'nd' :
                day === 3 || day === 23 ? 'rd' : 'th';

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).replace(/\d+/, `${day}${suffix}`);
}

function ProfileContent() {
  const { user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, syncWithStripe, fetchSubscription } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  // Show payment success message and confetti if redirected from successful payment
  useEffect(() => {
    if (paymentStatus === 'success') {
      console.log('Payment successful!');

      // Load confetti script and trigger celebration
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/tsparticles.confetti.bundle.min.js';
      script.onload = () => {
        // Confetti configuration
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
        };

        interface ConfettiOptions {
          spread?: number;
          startVelocity?: number;
          decay?: number;
          scalar?: number;
        }

        function fire(particleRatio: number, opts: ConfettiOptions) {
          (window as any).confetti(
            Object.assign({}, defaults, opts, {
              particleCount: Math.floor(count * particleRatio),
            })
          );
        }

        // Trigger confetti sequence
        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });

        fire(0.2, {
          spread: 60,
        });

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      };
      document.head.appendChild(script);
    }
  }, [paymentStatus]);

  // Add error handling for subscription sync
  useEffect(() => {
    if (subscription?.stripe_subscription_id) {
      try {
        syncWithStripe(subscription.stripe_subscription_id);
        console.log('Subscription synced with Stripe successfully');
      } catch (err: unknown) {
        console.error('Error syncing with Stripe:', err);
        setError('Unable to load subscription details');
      }
    }
  }, [syncWithStripe, subscription?.stripe_subscription_id]);

  // Add loading timeout with auto-refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let refreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 3;
    const REFRESH_INTERVAL = 3000; // 3 seconds

    const attemptRefresh = async () => {
      if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
        refreshAttempts++;
        console.log(`Attempting auto-refresh (${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`);
        await fetchSubscription();

        // If still loading, schedule next attempt
        if (isLoadingSubscription) {
          timeoutId = setTimeout(attemptRefresh, REFRESH_INTERVAL);
        }
      } else {
        setError('Loading subscription is taking longer than expected. Please refresh the page.');
      }
    };

    if (isLoadingSubscription) {
      timeoutId = setTimeout(attemptRefresh, REFRESH_INTERVAL);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoadingSubscription, fetchSubscription]);

  // Add refresh effect
  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id, fetchSubscription]);

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id && !subscription?.lemonsqueezy_subscription_id) return;

    setIsCancelling(true);
    try {
      const isLemonSqueezy = subscription.payment_processor === 'lemonsqueezy';
      const endpoint = isLemonSqueezy ? '/api/lemonsqueezy/cancel' : '/api/stripe/cancel';
      const subscriptionId = isLemonSqueezy
        ? subscription.lemonsqueezy_subscription_id
        : subscription.stripe_subscription_id;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId
        }),
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      setIsCancelModalOpen(false);
      showToast({
        type: 'success',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been successfully cancelled. You will continue to have access until the end of your billing period.'
      });
      router.refresh();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.stripe_subscription_id && !subscription?.lemonsqueezy_subscription_id) return;

    try {
      const isLemonSqueezy = subscription.payment_processor === 'lemonsqueezy';
      const endpoint = isLemonSqueezy ? '/api/lemonsqueezy/reactivate' : '/api/stripe/reactivate';
      const subscriptionId = isLemonSqueezy
        ? subscription.lemonsqueezy_subscription_id
        : subscription.stripe_subscription_id;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId
        }),
      });

      if (!response.ok) throw new Error('Failed to reactivate subscription');

      showToast({
        type: 'success',
        title: 'Subscription Reactivated',
        message: 'Your subscription has been successfully reactivated. You now have full access to all features.'
      });
      router.refresh();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-red-500">
          Failed to load subscription details. Please try refreshing.
        </div>
      }
    >
      <div className="space-y-6">
        {paymentStatus === 'success' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p className="text-green-600 dark:text-green-400">
              🎉 Thank you for your subscription! Your payment was successful.
            </p>
          </div>
        )}

      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account and subscription settings</p>
      </div>

      {/* Account Management Card */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccountManagement />
        </CardContent>
      </Card>

      {/* Current Subscription Card */}
      {subscription && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : isLoadingSubscription ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">Loading subscription details...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className=" font-medium ">Status:</span>
                    <Badge
                      variant={subscription.status === 'active' ? 'default' : 'secondary'}
                      className={`${subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}
                    >
                      {subscription.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Started: {formatSubscriptionDate(subscription.created_at)}
                  </div>
                </div>

                {subscription.status === 'canceled' ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-700 dark:text-blue-300 mb-3">
                      Your subscription has been canceled. Resubscribe to continue using premium features.
                    </p>
                    <Link
                      href="/pay"
                      className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg transition-all"
                    >
                      Resubscribe
                    </Link>
                  </div>
                ) : subscription.cancel_at_period_end ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                          Your subscription will be canceled at the end of the current billing period.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={handleReactivateSubscription}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          >
                            Reactivate Subscription
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                const isLemonSqueezy = subscription.payment_processor === 'lemonsqueezy';

                                if (isLemonSqueezy) {
                                  // For Lemon Squeezy, get the subscription details first to get the customer portal URL
                                  const response = await fetch(`/api/lemonsqueezy/subscription?id=${subscription.lemonsqueezy_subscription_id}`);
                                  const data = await response.json();
                                  if (data.subscription?.attributes?.urls?.customer_portal) {
                                    window.open(data.subscription.attributes.urls.customer_portal, '_blank');
                                  } else {
                                    showToast({
                                      type: 'error',
                                      title: 'Portal Unavailable',
                                      message: 'Customer portal is not available at this time.'
                                    });
                                  }
                                } else {
                                  // Stripe portal
                                  const response = await fetch('/api/stripe/portal', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ customerId: subscription.stripe_customer_id, userId: user?.id })
                                  });
                                  const data = await response.json();
                                  if (data.url) {
                                    window.open(data.url, '_blank');
                                  }
                                }
                              } catch (error) {
                                console.error('Error opening portal:', error);
                                showToast({
                                  type: 'error',
                                  title: 'Portal Error',
                                  message: 'Failed to open subscription management portal.'
                                });
                              }
                            }}
                            className=""
                            variant="outlinePrimary"
                          >
                            Manage Subscription
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 space-y-3">
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          try {
                            const isLemonSqueezy = subscription.payment_processor === 'lemonsqueezy';

                            if (isLemonSqueezy) {
                              // For Lemon Squeezy, get the subscription details first to get the customer portal URL
                              const response = await fetch(`/api/lemonsqueezy/subscription?id=${subscription.lemonsqueezy_subscription_id}`);
                              const data = await response.json();
                              if (data.subscription?.attributes?.urls?.customer_portal) {
                                window.open(data.subscription.attributes.urls.customer_portal, '_blank');
                              } else {
                                showToast({
                                  type: 'error',
                                  title: 'Portal Unavailable',
                                  message: 'Customer portal is not available at this time.'
                                });
                              }
                            } else {
                              // Stripe portal
                              const response = await fetch('/api/stripe/portal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ customerId: subscription.stripe_customer_id })
                              });
                              const data = await response.json();
                              if (data.url) {
                                window.open(data.url, '_blank');
                              }
                            }
                          } catch (error) {
                            console.error('Error opening portal:', error);
                            showToast({
                              type: 'error',
                              title: 'Portal Error',
                              message: 'Failed to open subscription management portal.'
                            });
                          }
                        }}
                        variant="outlinePrimary"
                      >
                        Manage Subscription
                      </Button>
                      <Button
                        onClick={() => setIsCancelModalOpen(true)}
                        variant="destructiveOutline"
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

        {/* Promo Code Banner */}
        <PromoCodeBanner />

        {/* Pricing Section for Upgrades */}
        <ProfilePricingSection
          currentPlan={getPlanFromSubscription(subscription)}
          onUpgrade={(planId) => {
            console.log('Upgrade to plan:', planId);
          }}
        />

        {/* Cancel Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Cancel Subscription?</h3>
              <p className="text-muted-foreground mb-6">
                You&apos;ll continue to have access until the end of your billing period on {new Date(subscription?.current_period_end || '').toLocaleDateString()}. No refunds are provided for cancellations.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  disabled={isCancelling}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastNotifications
          toasts={toasts}
          onRemove={removeToast}
        />
      </div>
    </ErrorBoundary>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileContent />
    </Suspense>
  );
}
