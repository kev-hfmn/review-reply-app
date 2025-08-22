'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Zap, Building2, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfilePricingSectionProps {
  currentPlan?: string;
  onUpgrade?: (planId: string) => void;
}

const pricingTiers = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    interval: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STARTER_VARIANT_ID || '',
    description: "Perfect for small businesses with fewer than 1,000 total reviews",
    icon: <Zap className="h-6 w-6" />,
    features: [
      "Fetch and manage up to 200 existing reviews when connecting",
      "Manually fetch new reviews at any time",
      "Automatically generate replies for newly fetched reviews",
      "Standard tone presets only (friendly, professional, casual, etc.)",
      "Manual approval of all replies",
      "Email notifications when new reviews and replies are ready",
      "Basic review dashboard showing review and reply counts"
    ],
    cta: "Upgrade to Starter",
    popular: false,
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    interval: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID || '',
    description: "For businesses with higher review volume or over 1,000 total reviews",
    icon: <Crown className="h-6 w-6" />,
    features: [
      "Fetch all existing reviews when connecting",
      "Automatic daily sync: new reviews are fetched for you every day at a time you choose",
      "Automatically generate replies for newly fetched reviews",
      "Custom brand instructions field to fine-tune tone and style",
      "Auto-approve rules for certain star ratings (for example 4 or 5 stars)",
      "Advanced insights including customer sentiment breakdown"
    ],
    cta: "Upgrade to Pro",
    popular: true,
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "pro-plus",
    name: "Pro Plus",
    price: "+$19",
    interval: "/month per location",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID || 'price_pro_plus',
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_PLUS_VARIANT_ID || '',
    description: "For Pro customers managing multiple locations",
    icon: <Building2 className="h-6 w-6" />,
    features: [
      "Full Pro plan features for each additional location",
      "Reduced per-location cost",
      "Separate dashboards and review management for each location"
    ],
    cta: "Add Locations",
    popular: false,
    color: "from-emerald-500 to-emerald-600"
  }
];

export function ProfilePricingSection({ currentPlan = 'starter', onUpgrade }: ProfilePricingSectionProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: typeof pricingTiers[0]) => {
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
        <p className="text-muted-foreground">
          Upgrade your subscription to unlock more powerful features
        </p>
      </CardHeader>
      <CardContent>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {pricingTiers.map((tier, i) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-xl p-6 border transition-all duration-300 ${
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
            All plans include a 30 day money back guarantee. Cancel anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
