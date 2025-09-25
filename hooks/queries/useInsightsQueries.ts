import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { WeeklyDigestInsights } from '@/lib/services/insightsService'

export type TimePeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

interface InsightsQueryResult {
  insights: WeeklyDigestInsights | null
  businessName?: string
  fromCache?: boolean
  cacheInfo?: {
    isStale: boolean
    isPromptOutdated: boolean
    cacheAge: number
    promptVersion: string
  }
}

/**
 * Query hook for fetching cached weekly insights (no AI generation)
 * Only retrieves existing cached data - never triggers expensive AI generation
 */
export const useWeeklyInsightsQuery = (
  businessId: string | null,
  weekStart: Date | null,
  weekEnd: Date | null,
  userId: string | null,
  periodType: TimePeriodType = 'weekly'
) => {
  return useQuery<InsightsQueryResult>({
    queryKey: [
      'weekly-insights', 
      businessId, 
      weekStart?.toISOString(), 
      weekEnd?.toISOString(),
      periodType
    ],
    queryFn: async () => {
      if (!businessId || !weekStart || !weekEnd || !userId) {
        throw new Error('Missing required parameters')
      }

      const response = await fetch('/api/insights/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to fetch insights')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch insights')
      }

      return {
        insights: data.insights,
        businessName: data.businessName,
        fromCache: data.fromCache,
        cacheInfo: data.cacheInfo
      }
    },
    enabled: !!businessId && !!weekStart && !!weekEnd && !!userId,
    staleTime: 30 * 60 * 1000,    // 30 minutes - insights don't change frequently
    gcTime: 2 * 60 * 60 * 1000,   // 2 hours - keep in memory longer for period switching
    refetchOnWindowFocus: false,   // Don't refetch on focus - insights are not real-time
    retry: (failureCount: number, error: unknown) => {
      // Don't retry subscription/permission errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message: string }).message
        if (message.includes('Pro plan') || message.includes('subscription') || message.includes('access denied')) {
          return false
        }
      }
      return failureCount < 2 // Limited retries for cache lookups
    },
  })
}

/**
 * Hook to invalidate insights cache after generation
 * Used when manually regenerating insights
 */
export const useInsightsCacheInvalidation = () => {
  const queryClient = useQueryClient()

  const invalidateInsightsCache = (businessId?: string, weekStart?: Date) => {
    if (businessId && weekStart) {
      // Invalidate specific cache entry
      queryClient.invalidateQueries({
        queryKey: ['weekly-insights', businessId, weekStart.toISOString()]
      })
    } else {
      // Invalidate all insights caches
      queryClient.invalidateQueries({
        queryKey: ['weekly-insights']
      })
    }
  }

  return { invalidateInsightsCache }
}

/**
 * Utility hook to get cached insights data synchronously
 * Useful for components that need to check if data exists without triggering queries
 */
export const useCachedInsights = (
  businessId: string | null,
  weekStart: Date | null,
  weekEnd: Date | null,
  periodType: TimePeriodType = 'weekly'
) => {
  const queryClient = useQueryClient()

  const queryKey = [
    'weekly-insights',
    businessId,
    weekStart?.toISOString(),
    weekEnd?.toISOString(),
    periodType
  ]

  const cachedData = queryClient.getQueryData<InsightsQueryResult>(queryKey)

  return {
    hasCachedData: !!cachedData?.insights,
    cachedInsights: cachedData?.insights || null,
    isStale: cachedData?.cacheInfo?.isStale || false,
    isPromptOutdated: cachedData?.cacheInfo?.isPromptOutdated || false
  }
}