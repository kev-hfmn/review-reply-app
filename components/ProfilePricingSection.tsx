'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Crown, Zap, Building2, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pricingTiers as basePricingTiers } from '@/lib/pricing';
import { calculateDynamicPricing } from '@/lib/utils/subscription';
import Link from 'next/link';

interface ProfilePricingSectionProps {
  currentPlan?: string;
  onUpgrade?: (planId: string) => void;
}

const getIcon = (iconName: string | undefined) => {
  switch (iconName) {
    case 'zap': return <Zap className="h-6 w-6" />;
    case 'crown': return <Crown className="h-6 w-6" />;
    case 'building2': return <Building2 className="h-6 w-6" />;
    default: return null;
  }
};

// Dynamic pricing tiers - will be calculated inside component

export function ProfilePricingSection({ currentPlan = 'starter', onUpgrade }: ProfilePricingSectionProps) {
  const { user, businesses } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Calculate business count from existing AuthContext
  const businessCount = businesses.length;

  // Calculate dynamic pricing for Pro Plus based on business count
  const proPlusPricing = useMemo(() => {
    return calculateDynamicPricing('pro-plus', Math.max(1, businessCount));
  }, [businessCount]);

  // Create dynamic pricing tiers
  const profilePricingTiers = useMemo(() => {
    return basePricingTiers.map(tier => {
      if (tier.id === 'pro-plus') {
        // Use dynamic pricing for Pro Plus
        return {
          ...tier,
          icon: getIcon(tier.iconName),
          price: `$${proPlusPricing.totalPrice}`,
          interval: businessCount > 1 ? '/month' : '/month per additional location',
          name: 'Pro Plus',
          description: businessCount > 1
            ? `${proPlusPricing.breakdown}/month - Perfect for multiple locations`
            : 'Perfect for scaling to multiple locations',
          cta: 'Upgrade to Pro Plus'
        };
      }

      return {
        ...tier,
        icon: getIcon(tier.iconName),
        cta: tier.id === 'starter' ? 'Upgrade to Starter' :
             tier.id === 'pro' ? 'Upgrade to Pro' :
             tier.cta,
        description: tier.id === 'starter' ? 'Perfect for small businesses with several hundred reviews' : tier.description
      };
    });
  }, [basePricingTiers, proPlusPricing, businessCount]);

  const handleUpgrade = async (tier: typeof profilePricingTiers[0]) => {
    if (!user?.id) return;

    setIsLoading(tier.id);

    // Feature flag for Lemon Squeezy
    const useLemonSqueezy = process.env.NEXT_PUBLIC_USE_LEMON_SQUEEZY === 'true';

    try {
      const endpoint = useLemonSqueezy ? '/api/lemonsqueezy/checkout' : '/api/stripe/checkout';

      // Prepare payload based on payment processor
      const payload = useLemonSqueezy
        ? {
            variantId: tier.lemonSqueezyVariantId,
            userId: user.id,
            customData: { planId: tier.id },
            // For Pro Plus with multiple businesses, pass business count as quantity
            ...(tier.id === 'pro-plus' && businessCount > 1 && { quantity: businessCount })
          }
        : {
            priceId: tier.priceId,
            userId: user.id
          };

      // Validate required fields
      if (useLemonSqueezy && !tier.lemonSqueezyVariantId) {
        throw new Error(`Lemon Squeezy variant ID not configured for ${tier.name}`);
      }

      // Debug logging for Pro Plus quantity
      if (tier.id === 'pro-plus') {
        console.log('🔢 Pro Plus checkout:', {
          businessCount,
          quantity: payload.quantity || 1,
          pricing: proPlusPricing
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Handle different response types: checkout URL vs subscription update
      if (data.url) {
        // New subscription checkout - redirect to payment
        window.location.href = data.url;
      } else if (data.success && data.action === 'subscription_updated') {
        // Subscription update success - show success message and reload
        alert(`Plan updated successfully! Your subscription has been changed to ${tier.name}.`);
        // Refresh the page to show updated plan
        window.location.reload();
      } else {
        throw new Error(data.error || 'Unexpected response from server');
      }
    } catch (error) {
      console.error('Error processing plan change:', error);

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('variant ID not configured')) {
        alert('This plan is temporarily unavailable. Please try again later or contact support.');
      } else if (error instanceof Error && error.message.includes('Failed to update subscription')) {
        alert('Unable to update your subscription. Please try again or contact support.');
      } else {
        alert('Unable to process plan change. Please try again or contact support.');
      }

      onUpgrade?.(tier.id);
    } finally {
      setIsLoading(null);
    }
  };

  const isCurrentPlan = (tierId: string) => {
    return currentPlan === tierId;
  };

  const shouldShowUpgrade = (tierId: string) => {
    // Allow upgrades for users without a subscription (basic/null)
    if (!currentPlan || currentPlan === 'basic') return true;
    if (currentPlan === 'starter' && (tierId === 'pro' || tierId === 'pro-plus')) return true;
    if (currentPlan === 'pro' && tierId === 'pro-plus') return true;
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Choose Your Plan
        </CardTitle>

      </CardHeader>
      <CardContent>
      <p className="text-muted-foreground mt-0 mb-6">
          Upgrade to a paid plan to unlock all powerful features. A subscription is required to use the app.
        </p>

        {/* Business Count Indicator */}
        {businessCount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Building2 className="h-4 w-4" />
              <span>
                You have <strong>{businessCount}</strong> business location{businessCount === 1 ? '' : 's'} connected
                {businessCount > 1 && (
                  <span className="ml-1">
                    (Pro Plus required for multiple locations). Alternatively, remove connected locations in <Link href="/settings?tab=integrations" className="underline">Settings</Link>.
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {profilePricingTiers.map((tier, i) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-xl p-6 bg-background border transition-all duration-300 ${
              isCurrentPlan(tier.id)
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            {/* Popular badge */}
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Current plan badge */}
            {isCurrentPlan(tier.id) && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center my-5">

              <h3 className="text-2xl font-semibold text-foreground mb-2">{tier.name}</h3>
              <div className="flex items-baseline justify-center mt-4">
                <span className="text-3xl font-medium text-foreground">{tier.price}</span>
                <span className="text-muted-foreground ml-1">{tier.interval}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
              {tier.excludedFeatures?.map((feature, index) => (
                <li key={`excluded-${index}`} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground/70 line-through">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {isCurrentPlan(tier.id) ? (
                <div className="w-full py-3 px-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Your Current Plan
                  </span>
                </div>
              ) : shouldShowUpgrade(tier.id) ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUpgrade(tier)}
                  disabled={isLoading === tier.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-primary/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading === tier.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    tier.cta
                  )}
                </motion.button>
              ) : (
                <div className="w-full py-3 px-4 bg-muted/50 border border-border rounded-lg text-center">
                  <span className="text-muted-foreground font-medium">
                    Contact Sales
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14 day money back guarantee. Cancel anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
