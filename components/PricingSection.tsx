'use client'

import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pricingTiers } from '@/lib/pricing';

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
    <>
      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-3 gap-8 mt-12 items-start">
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
              {tier.excludedFeatures?.map((feature) => (
                <li key={`excluded-${feature}`} className="flex items-center flex-row gap-2">
                  <X className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <span className="text-slate-400 dark:text-slate-500 line-through">{feature}</span>
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

      {/* Mobile: Horizontal scroll */}
      <div className="block md:hidden mt-6">
        <div
          className="mobile-scroll-container py-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex space-x-4" style={{ width: 'max-content' }}>
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleTierClick(tier.id)}
                className={`flex-shrink-0 w-[280px] scroll-snap-align-center relative group rounded-2xl p-6 shadow-lg hover:bg-primary/5 dark:hover:bg-primary/10 hover:shadow-sm dark:hover:border-primary/50 cursor-pointer transition-all duration-300 h-fit ${
                  selectedTier === tier.id
                    ? 'bg-white dark:bg-primary/10 ring-2 ring-primary transform scale-105'
                    : 'bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary/50'
                }`}
                style={{ scrollSnapAlign: 'center' }}
              >
                {/* Show Popular badge only for Enterprise tier */}
                {tier.popular && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 text-sm bg-primary text-white rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tier.name}</h3>
                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{tier.price}</span>
                  <span className="ml-1 text-slate-500 dark:text-slate-400">{tier.interval}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{tier.description}</p>
                <ul className="mt-6 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start flex-row gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                  {tier.excludedFeatures?.map((feature) => (
                    <li key={`excluded-${feature}`} className="flex items-start flex-row gap-2">
                      <X className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-400 dark:text-slate-500 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCTAClick}
                  className={`mt-6 w-full py-3 px-4 rounded-lg text-center text-sm font-medium transition-colors group-hover:bg-primary/80 group-hover:text-white ${
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
        </div>
      </div>
    </>
  );
}
