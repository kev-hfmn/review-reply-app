export interface PricingTier {
  id: string;
  name: string;
  price: string;
  interval: string;
  priceId?: string;
  lemonSqueezyVariantId?: string;
  description: string;
  iconName?: string;
  features: string[];
  excludedFeatures?: string[];
  cta: string;
  popular: boolean;
  color?: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$17",
    interval: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STARTER_VARIANT_ID || '',
    description: "Reply management without autopilot, perfect for small businesses with several hundred reviews.",
    iconName: "zap",
    features: [
      "Fetch all existing reviews when connecting",
      "Post up to 200 replies per month",
      "Manually fetch new reviews at any time",
      "Batch-generate replies for reviews",
      "Custom brand instructions & tone customization",
      "Manual approval & posting of replies only",
    ],
    excludedFeatures: [
      "Automatic daily sync of new reviews",
      "Auto-approve & posting rules for certain star ratings",
      "Advanced insights & sentiment analysis"
    ],
    cta: "Get Started",
    popular: false,
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    interval: "/month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID || '',
    description: "Includes full autopilot mode, for businesses with higher review volume or over 1,000 reviews.",
    iconName: "crown",
    features: [
      "Fetch all existing reviews when connecting",
      "Unlimited replies per month",
      "Automatic daily sync: new reviews are fetched for you every day",
      "Automatically generate replies for newly fetched reviews",
      "Auto-approve & posting rules for certain star ratings (for example 4 or 5 stars)",
      "Custom brand instructions field to fine-tune tone and style",
      "Advanced review insights including customer sentiment breakdown"
    ],
    cta: "Get Started",
    popular: true,
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "pro-plus",
    name: "Pro Plus - Multiple Locations Add-On",
    price: "+$15",
    interval: "/month per additional location",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID || 'price_pro_plus',
    lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_PLUS_VARIANT_ID || '',
    description: "For Pro customers managing multiple locations.",
    iconName: "building2",
    features: [
      "Full Pro plan features for each additional location",
      "Reduced per-location cost",
      "Separate dashboards and review management for each location"
    ],
    cta: "Get Started",
    popular: false,
    color: "from-emerald-500 to-emerald-600"
  }
];
