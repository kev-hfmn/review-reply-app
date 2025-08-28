import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionQuery } from '@/hooks/queries/useSubscriptionQuery';
import type {
  DashboardStats,
  Business,
  ChartDataPoint,
  OnboardingStep
} from '@/types/dashboard';
import type { Subscription } from '@/hooks/useSubscription';

interface DashboardApiData {
  businesses: Business[];
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  onboardingSteps: OnboardingStep[];
  subscription?: Subscription | null; // Optional - comes from centralized cache
}

interface DashboardData {
  businesses: Business[];
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  onboardingSteps: OnboardingStep[];
  subscription: Subscription | null;
}

async function fetchDashboardData(userId: string): Promise<DashboardApiData> {
  console.log('Frontend: Fetching dashboard data for userId:', userId);
  const response = await fetch(`/api/dashboard/data?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Frontend: Dashboard API response:', data);
  return data;
}

export function useDashboardDataOptimized() {
  const { user } = useAuth();
  
  // Get subscription from centralized cache
  const subscriptionQuery = useSubscriptionQuery(user?.id || null);
  
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-optimized', user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user?.id,
    
    // Restore proper cache times (was staleTime: 0 for debugging)
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
    
    // Prevent unnecessary refetches
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    
    // Smart retry logic
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('40')) {
        return false;
      }
      return failureCount < 2;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: false,
    networkMode: 'offlineFirst',
  });

  // Combine dashboard data with subscription from cache
  const data: DashboardData | undefined = dashboardQuery.data ? {
    ...dashboardQuery.data,
    subscription: subscriptionQuery.data?.subscription || null
  } : undefined;

  return {
    data,
    isLoading: dashboardQuery.isLoading || subscriptionQuery.isLoading,
    error: dashboardQuery.error || subscriptionQuery.error,
    refetch: dashboardQuery.refetch
  };
}

// Helper hook for cache invalidation when user performs actions
export function useDashboardCacheInvalidation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const invalidateDashboard = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard-optimized', user.id],
        exact: true 
      });
      // Also invalidate subscription cache if needed
      queryClient.invalidateQueries({ 
        queryKey: ['subscription', user.id],
        exact: true 
      });
    }
  };
  
  const refetchDashboard = () => {
    if (user?.id) {
      queryClient.refetchQueries({ 
        queryKey: ['dashboard-optimized', user.id],
        exact: true 
      });
    }
  };
  
  return {
    invalidateDashboard,
    refetchDashboard
  };
}
