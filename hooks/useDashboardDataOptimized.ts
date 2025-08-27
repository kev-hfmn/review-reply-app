import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
  DashboardStats,
  Business,
  ChartDataPoint,
  OnboardingStep
} from '@/types/dashboard';
import type { Subscription } from '@/hooks/useSubscription';

interface DashboardData {
  businesses: Business[];
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  onboardingSteps: OnboardingStep[];
  subscription: Subscription | null;
}

async function fetchDashboardData(userId: string): Promise<DashboardData> {
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

  return useQuery({
    queryKey: ['dashboard-optimized', user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user?.id,
    
    // Temporarily reduce cache times for debugging
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    
    // Prevent unnecessary refetches
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
    refetchOnMount: false, // Don't refetch if data is still fresh
    refetchOnReconnect: false, // Don't refetch on network reconnect
    
    // Smart retry logic
    retry: (failureCount, error) => {
      // Don't retry on 4xx client errors (user/auth errors)
      if (error instanceof Error && error.message.includes('40')) {
        return false;
      }
      // Only retry up to 2 times for server errors
      return failureCount < 2;
    },
    
    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Enable background refetching but with longer intervals
    refetchInterval: false, // Disable automatic refetching since data changes infrequently
    
    // Network mode - show cached data even when offline
    networkMode: 'offlineFirst',
  });
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
