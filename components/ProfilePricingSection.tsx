'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Crown, Zap, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pricingTiers as basePricingTiers } from '@/lib/pricing';

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

const profilePricingTiers = basePricingTiers.map(tier => ({
  ...tier,
  icon: getIcon(tier.iconName),
  cta: tier.id === 'starter' ? 'Upgrade to Starter' :
       tier.id === 'pro' ? 'Upgrade to Pro' :
       tier.id === 'pro-plus' ? 'Upgrade to Pro Plus' : tier.cta,
  name: tier.id === 'pro-plus' ? 'Pro Plus' : tier.name,
  interval: tier.id === 'pro-plus' ? '/month per additional location' : tier.interval,
  description: tier.id === 'starter' ? 'Perfect for small businesses with several hundred reviews' : tier.description
}));

export function ProfilePricingSection({ currentPlan = 'starter', onUpgrade }: ProfilePricingSectionProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

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
            customData: { planId: tier.id }
          }
        : {
            priceId: tier.priceId,
            userId: user.id
          };

      // Validate required fields
      if (useLemonSqueezy && !tier.lemonSqueezyVariantId) {
        throw new Error(`Lemon Squeezy variant ID not configured for ${tier.name}`);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('variant ID not configured')) {
        alert('This plan is temporarily unavailable. Please try again later or contact support.');
      } else {
        alert('Unable to create checkout session. Please try again or contact support.');
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
      <p className="text-muted-foreground mt-0 mb-10">
          Upgrade to a paid plan to unlock all powerful features. A subscription is required to use the app.
        </p>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
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
