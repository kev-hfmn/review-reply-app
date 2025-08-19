// File: /components/PricingSection.tsx

// import Link from 'next/link';
// import { StripeBuyButton } from './StripeBuyButton';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// interface PricingSectionProps {
//   showFullDetails?: boolean;
// }

const pricingTiers = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    interval: "/month",
    description: "Perfect for small businesses with fewer than 1,000 total reviews",
    features: [
      "Fetch and manage up to 200 existing reviews when connecting",
      "Manually fetch new reviews at any time",
      "Automatically generate replies for newly fetched reviews",
      "Standard tone presets only (friendly, professional, casual, etc.)",
      "Manual approval of all replies",
      "Email notifications when new reviews and replies are ready",
      "Basic review dashboard showing review and reply counts"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    interval: "/month",
    description: "For businesses with higher review volume or over 1,000 total reviews",
    features: [
      "Fetch all existing reviews when connecting",
      "Automatic daily sync: new reviews are fetched for you every day at a time you choose",
      "Automatically generate replies for newly fetched reviews",
      "Custom brand instructions field to fine-tune tone and style",
      "Auto-approve rules for certain star ratings (for example 4 or 5 stars)",
      "Advanced insights including customer sentiment breakdown"
    ],
    cta: "Get Started",
    popular: true
  },
  {
    id: "pro-plus",
    name: "Pro Plus - Additional Locations Add-On",
    price: "+$19",
    interval: "/month per location",
    description: "For Pro customers managing multiple locations",
    features: [
      "Full Pro plan features for each additional location",
      "Reduced per-location cost",
      "Separate dashboards and review management for each location"
    ],
    cta: "Get Started",
    popular: false
  }
];

export function PricingSection() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>("pro");

  const handleTierClick = (tierId: string) => {
    setSelectedTier(currentTier => currentTier === tierId ? null : tierId);
  };

  const handleCTAClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/profile');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-start">
      {pricingTiers.map((tier, i) => (
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => handleTierClick(tier.id)}
          className={`relative group rounded-2xl p-8 shadow-lg hover:bg-primary/5 dark:hover:bg-primary/10 hover:shadow-sm dark:hover:border-primary/50 cursor-pointer transition-all duration-300 h-fit ${
            selectedTier === tier.id
              ? 'bg-white dark:bg-primary/10 ring-2 ring-primary transform scale-105'
              : 'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary/50'
          }`}
        >
          {/* Show Popular badge only for Enterprise tier */}
          {tier.popular && (
            <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 text-sm bg-primary text-white rounded-full">
              Popular
            </span>
          )}
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{tier.name}</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-bold text-slate-900 dark:text-white">{tier.price}</span>
            <span className="ml-1 text-slate-500 dark:text-slate-400">{tier.interval}</span>
          </div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">{tier.description}</p>
          <ul className="mt-8 space-y-3">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center flex-row gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCTAClick}
            className={`mt-8 w-full py-3 px-4 rounded-lg text-center font-medium transition-colors group-hover:bg-primary/80 group-hover:text-white ${
              selectedTier === tier.id
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {tier.cta}
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
}
