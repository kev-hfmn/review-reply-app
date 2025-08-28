import { PLAN_CONFIGS, PlanId } from '@/lib/config/plans';

// Client-safe subscription utilities (no server dependencies)
export function hasFeature(planId: string, feature: string): boolean {
  const config = PLAN_CONFIGS[planId as PlanId];
  if (!config) return false;
  
  return (config.features as any)[feature] === true;
}

export function getPlanLimit(planId: string, limitType: string): number {
  const config = PLAN_CONFIGS[planId as PlanId];
  if (!config) return 0;
  
  return (config.limits as any)[limitType] || 0;
}

export function getPlanConfig(planId: string) {
  return PLAN_CONFIGS[planId as PlanId] || PLAN_CONFIGS.basic;
}
