import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SubscriptionStatus } from '@/lib/utils/subscription'

export const useSubscriptionQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!userId) throw new Error('User ID required')
      
      // Use existing API endpoint (maintains all business logic)
      const response = await fetch('/api/subscription/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      if (!response.ok) {
        throw new Error(`Subscription check failed: ${response.status}`)
      }
      
      return response.json()
    },
    enabled: !!userId,
    
    // Longer cache - subscription changes are rare
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
    
    // Prevent excessive refetching
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    
    // Smart retry logic (same pattern as reviews)
    retry: (failureCount: number, error: unknown) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status
        if (status >= 400 && status < 500) return false
      }
      return failureCount < 2
    },
  })
}

// Helper hook for subscription status invalidation
export const useSubscriptionInvalidation = () => {
  const queryClient = useQueryClient()
  
  const invalidateSubscription = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['subscription', userId] })
  }
  
  const refetchSubscription = (userId: string) => {
    queryClient.refetchQueries({ queryKey: ['subscription', userId] })
  }
  
  return { invalidateSubscription, refetchSubscription }
}