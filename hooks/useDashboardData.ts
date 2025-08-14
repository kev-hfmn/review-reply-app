import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type { 
  DashboardStats, 
  Business, 
  Review, 
  Activity, 
  ChartDataPoint,
  OnboardingStep 
} from '@/types/dashboard';

export function useDashboardData() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback((
    reviewsThisMonth: Review[], 
    reviewsLastMonth: Review[], 
    activities: Activity[], 
    allReviews: Review[]
  ): DashboardStats => {
    // Use proper calendar months with date-fns
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Reviews this month (already filtered at DB level)
    const reviewsThisMonthCount = reviewsThisMonth.length;
    const reviewsLastMonthCount = reviewsLastMonth.length;
    
    const reviewsThisMonthChange = reviewsLastMonthCount > 0 
      ? ((reviewsThisMonthCount - reviewsLastMonthCount) / reviewsLastMonthCount) * 100 
      : reviewsThisMonthCount > 0 ? 100 : 0;

    // Replies posted this month (activities with reply_posted type)
    const repliesThisMonth = activities.filter(a => 
      a.type === 'reply_posted' && new Date(a.created_at) >= thisMonthStart
    ).length;
    
    const repliesLastMonth = activities.filter(a => 
      a.type === 'reply_posted' && 
      new Date(a.created_at) >= lastMonthStart && 
      new Date(a.created_at) <= lastMonthEnd
    ).length;
    
    const repliesPostedChange = repliesLastMonth > 0 
      ? ((repliesThisMonth - repliesLastMonth) / repliesLastMonth) * 100 
      : repliesThisMonth > 0 ? 100 : 0;

    // Average rating (this month only - using DB-filtered reviews)
    const avgRating = reviewsThisMonth.length > 0
      ? reviewsThisMonth.reduce((sum, r) => sum + r.rating, 0) / reviewsThisMonth.length
      : 0;

    // Previous month's average (using DB-filtered reviews)
    const previousAvgRating = reviewsLastMonth.length > 0
      ? reviewsLastMonth.reduce((sum, r) => sum + r.rating, 0) / reviewsLastMonth.length
      : avgRating;

    const avgRatingChange = previousAvgRating > 0
      ? ((avgRating - previousAvgRating) / previousAvgRating) * 100
      : 0;

    // Pending approvals (only true pending items - not posted ones) - use all reviews
    const pendingApprovals = allReviews.filter(r => 
      r.status === 'pending' || r.status === 'needs_edit'
    ).length;

    // Calculate change in pending approvals (current vs last month)
    const previousPendingApprovals = reviewsLastMonth.filter(r => 
      r.status === 'pending' || r.status === 'needs_edit'
    ).length;
    
    const pendingApprovalsChange = previousPendingApprovals > 0
      ? ((pendingApprovals - previousPendingApprovals) / previousPendingApprovals) * 100
      : pendingApprovals > 0 ? 100 : 0;

    return {
      reviewsThisWeek: reviewsThisMonthCount, // Keep interface but use monthly data
      reviewsThisWeekChange: reviewsThisMonthChange,
      repliesPosted: repliesThisMonth,
      repliesPostedChange,
      avgRating,
      avgRatingChange,
      pendingApprovals,
      pendingApprovalsChange,
      totalReviews: allReviews.length,
      recentActivities: activities.slice(0, 5) // Most recent 5 activities
    };
  }, []);

  const generateChartData = useCallback((reviews: Review[]): ChartDataPoint[] => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date.toISOString().split('T')[0];
    });

    return last14Days.map(date => {
      const dayReviews = reviews.filter(r => 
        r.review_date.startsWith(date)
      );
      
      const avgRating = dayReviews.length > 0
        ? dayReviews.reduce((sum, r) => sum + r.rating, 0) / dayReviews.length
        : 0;

      return {
        date,
        reviews: dayReviews.length,
        avgRating: Math.round(avgRating * 10) / 10
      };
    });
  }, []);

  const generateOnboardingSteps = useCallback((businesses: Business[]): OnboardingStep[] => {
    const hasBusiness = businesses.length > 0;
    const hasGoogleIntegration = businesses.some(b => b.google_business_id);
    
    return [
      {
        id: 'google-access',
        title: 'Approve Google access',
        description: 'Grant access to post replies to your Google Business reviews',
        completed: hasGoogleIntegration,
        actionText: 'Start Setup',
        action: () => {
          // TODO: Open Google API approval modal
          console.log('Open Google API modal');
        }
      },
      {
        id: 'brand-voice',
        title: 'Pick your brand voice',
        description: 'Customize how AI generates replies to match your business tone',
        completed: hasBusiness, // Simplified for now
        actionText: 'Customize Voice',
        action: () => {
          // TODO: Navigate to settings
          console.log('Navigate to brand voice settings');
        }
      },
      {
        id: 'auto-replies',
        title: 'Start auto-replies',
        description: 'Enable automatic reply posting for high-rated reviews',
        completed: false, // This would check business settings
        actionText: 'Enable Auto-replies',
        action: () => {
          // TODO: Navigate to settings
          console.log('Navigate to approval settings');
        }
      }
    ];
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch businesses for the user
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (businessesError) {
        throw new Error(`Failed to fetch businesses: ${businessesError.message}`);
      }

      const businessIds = businessesData?.map(b => b.id) || [];
      setBusinesses(businessesData || []);

      if (businessIds.length === 0) {
        // No businesses yet, set empty states
        setStats({
          reviewsThisWeek: 0,
          reviewsThisWeekChange: 0,
          repliesPosted: 0,
          repliesPostedChange: 0,
          avgRating: 0,
          avgRatingChange: 0,
          pendingApprovals: 0,
          pendingApprovalsChange: 0,
          totalReviews: 0,
          recentActivities: []
        });
        // Set mock chart data for demo purposes when no businesses exist
        const mockChartData = Array.from({ length: 14 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (13 - i));
          const reviews = i % 4 === 0 ? 1 : 0; // Some days have 1 review, others 0
          return {
            date: date.toISOString().split('T')[0],
            reviews,
            avgRating: reviews > 0 ? 4.5 : 0
          };
        });
        setChartData(mockChartData);
        setOnboardingSteps(generateOnboardingSteps([]));
        setIsLoading(false);
        return;
      }

      // Calculate proper calendar month ranges using date-fns
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      
      // Format dates for DB queries (YYYY-MM-DD format)
      const thisMonthStartStr = format(thisMonthStart, 'yyyy-MM-dd');
      const thisMonthEndStr = format(thisMonthEnd, 'yyyy-MM-dd');
      const lastMonthStartStr = format(lastMonthStart, 'yyyy-MM-dd');
      const lastMonthEndStr = format(lastMonthEnd, 'yyyy-MM-dd');
      
      console.log('📅 Dashboard date ranges:');
      console.log(`This month: ${thisMonthStartStr} to ${thisMonthEndStr}`);
      console.log(`Last month: ${lastMonthStartStr} to ${lastMonthEndStr}`);

      // Fetch all reviews for total count and pending approvals
      const { data: allReviewsData, error: allReviewsError } = await supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false });

      if (allReviewsError) {
        throw new Error(`Failed to fetch all reviews: ${allReviewsError.message}`);
      }

      // Fetch reviews for this month (using DB-level date filtering with proper calendar months)
      const { data: reviewsThisMonth, error: reviewsThisMonthError } = await supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .gte('review_date', thisMonthStartStr)
        .lte('review_date', thisMonthEndStr)
        .order('review_date', { ascending: false });

      if (reviewsThisMonthError) {
        throw new Error(`Failed to fetch this month's reviews: ${reviewsThisMonthError.message}`);
      }

      // Fetch reviews for last month (for comparison)
      const { data: reviewsLastMonth, error: reviewsLastMonthError } = await supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .gte('review_date', lastMonthStartStr)
        .lte('review_date', lastMonthEndStr)
        .order('review_date', { ascending: false });

      if (reviewsLastMonthError) {
        throw new Error(`Failed to fetch last month's reviews: ${reviewsLastMonthError.message}`);
      }

      // Fetch activities for all businesses
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) {
        throw new Error(`Failed to fetch activities: ${activitiesError.message}`);
      }

      // Calculate stats using DB-filtered data
      const calculatedStats = calculateStats(
        reviewsThisMonth || [], 
        reviewsLastMonth || [], 
        activitiesData || [], 
        allReviewsData || []
      );
      setStats(calculatedStats);

      // Generate chart data using all reviews
      const chartData = generateChartData(allReviewsData || []);
      setChartData(chartData);

      // Generate onboarding steps
      const steps = generateOnboardingSteps(businessesData || []);
      setOnboardingSteps(steps);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, calculateStats, generateChartData, generateOnboardingSteps]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refetch = useCallback(() => {
    return fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    businesses,
    stats,
    chartData,
    onboardingSteps,
    isLoading,
    error,
    refetch
  };
}