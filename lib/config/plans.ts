// lib/config/plans.ts
export const PLAN_CONFIGS = {
  basic: {
    features: {
      reviewSync: false,
      aiReplies: false,
      autoApproval: false,
      customVoice: false,
      advancedInsights: false,
      bulkOperations: false,
      autoSync: false
    },
    limits: {
      maxReviewsPerSync: -1, // Unlimited sync for all plans
      maxBusinesses: 1,
      maxRepliesPerMonth: 0, // No replies allowed
      syncFrequency: 'never' as const,
      maxBulkActions: 0
    },
    pricing: {
      basePrice: 0,
      additionalLocationPrice: 0,
      currency: 'USD'
    },
    ui: {
      showUpgradePrompts: true,
      defaultUpgradePlan: 'starter' as const
    }
  },
  starter: {
    features: {
      reviewSync: true,
      aiReplies: true,
      autoApproval: false, // Manual only
      customVoice: false, // Standard presets only
      advancedInsights: false,
      bulkOperations: true,
      autoSync: false // Manual sync only
    },
    limits: {
      maxReviewsPerSync: -1, // Unlimited sync for all plans
      maxBusinesses: 1,
      maxRepliesPerMonth: 200, // 200 replies per month
      syncFrequency: 'manual' as const,
      maxBulkActions: 10
    },
    pricing: {
      basePrice: 17,
      additionalLocationPrice: 0,
      currency: 'USD'
    },
    ui: {
      showUpgradePrompts: true,
      defaultUpgradePlan: 'pro' as const
    }
  },
  pro: {
    features: {
      reviewSync: true,
      aiReplies: true,
      autoApproval: true,
      customVoice: true,
      advancedInsights: true,
      bulkOperations: true,
      autoSync: true
    },
    limits: {
      maxReviewsPerSync: -1, // Unlimited sync for all plans
      maxBusinesses: 1,
      maxRepliesPerMonth: -1, // Unlimited replies
      syncFrequency: 'daily' as const,
      maxBulkActions: -1 // Unlimited
    },
    pricing: {
      basePrice: 29,
      additionalLocationPrice: 0,
      currency: 'USD'
    },
    ui: {
      showUpgradePrompts: true,
      defaultUpgradePlan: 'pro-plus' as const
    }
  },
  'pro-plus': {
    features: {
      reviewSync: true,
      aiReplies: true,
      autoApproval: true,
      customVoice: true,
      advancedInsights: true,
      bulkOperations: true,
      autoSync: true
    },
    limits: {
      maxReviewsPerSync: -1, // Unlimited sync for all plans
      maxBusinesses: -1, // Unlimited locations
      maxRepliesPerMonth: -1, // Unlimited replies
      syncFrequency: 'daily' as const,
      maxBulkActions: -1
    },
    pricing: {
      basePrice: 29,
      additionalLocationPrice: 15, // $15 per additional location (matches Lemon Squeezy)
      currency: 'USD'
    },
    ui: {
      showUpgradePrompts: false,
      defaultUpgradePlan: null
    }
  }
} as const;

export type PlanId = keyof typeof PLAN_CONFIGS;
export type PlanFeatures = typeof PLAN_CONFIGS[PlanId]['features'];
export type PlanLimits = typeof PLAN_CONFIGS[PlanId]['limits'];
export type PlanPricing = typeof PLAN_CONFIGS[PlanId]['pricing'];
