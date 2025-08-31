import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type { 
  Business, 
  Review, 
  Activity, 
  BusinessSettings,
  DashboardStats,
  ChartDataPoint,
  OnboardingStep
} from '@/types/dashboard';
import type { Subscription } from '@/hooks/useSubscription';

interface DashboardApiResponse {
  businesses: Business[];
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  onboardingSteps: OnboardingStep[];
  subscription?: Subscription | null; // Optional - handled by centralized cache
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  console.log('Dashboard API called with userId:', userId);

  // Create service role client to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
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

    // First fetch businesses to get business IDs
    const { data: businessesData, error: businessesError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('Businesses query result:', { 
      businessesData: businessesData?.length || 0, 
      businessesDataSample: businessesData?.[0] || null,
      error: businessesError?.message,
      errorDetails: businessesError,
      userId 
    });

    if (businessesError) {
      throw new Error(`Failed to fetch businesses: ${businessesError.message}`);
    }

    const businessIds = businessesData?.map(b => b.id) || [];
    console.log('Business IDs found:', businessIds);

    // If no businesses, return empty data with onboarding steps for new users
    if (businessIds.length === 0) {
      console.log('No businesses found for userId:', userId);
      const emptyStats: DashboardStats = {
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
      };

      const emptyChartData = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (13 - i));
        return {
          date: date.toISOString().split('T')[0],
          reviews: 0,
          avgRating: 0
        };
      });

      // Generate onboarding steps for users without businesses
      const newUserOnboardingSteps: OnboardingStep[] = [
        {
          id: 'connect-google',
          title: 'Connect your Google Business Profile',
          description: 'One-click connection to start syncing your reviews and managing replies automatically.',
          completed: false,
          actionText: 'Connect Now',
          action: () => {
            // Navigate to settings integrations tab
            window.location.href = '/settings?tab=integrations';
          }
        },
        {
          id: 'premium-plan',
          title: 'Choose a plan to use RepliFast',
          description: 'Upgrade to a premium plan to unlock features and save time with AI-powered automation.',
          completed: false,
          actionText: 'Choose Plan',
          action: () => {
            // Navigate to profile page with pricing
            window.location.href = '/profile';
          }
        },
        {
          id: 'brand-voice',
          title: 'Customize your brand voice',
          description: 'Set the tone and personality for AI-generated replies to match your business style.',
          completed: false,
          actionText: 'Set Voice',
          action: () => {
            // Navigate to settings voice tab
            window.location.href = '/settings?tab=voice';
          }
        },
        {
          id: 'auto-replies',
          title: 'Enable smart automation',
          description: 'Let AI automatically generate and post replies to save you time while maintaining quality.',
          completed: false,
          actionText: 'Turn On',
          action: () => {
            // Navigate to settings approval tab
            window.location.href = '/settings?tab=automation';
          }
        }
      ];

      return NextResponse.json({
        businesses: businessesData || [],
        stats: emptyStats,
        chartData: emptyChartData,
        onboardingSteps: newUserOnboardingSteps
        // subscription removed - handled by centralized cache
      });
    }

    // Execute remaining 5 queries in parallel using Promise.all (subscription removed)
    const [
      allReviewsResult,
      reviewsThisMonthResult,
      reviewsLastMonthResult,
      activitiesResult,
      businessSettingsResult
    ] = await Promise.all([
      // 1. Fetch all reviews for total count and pending approvals
      supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false }),

      // 2. Fetch reviews for this month (using DB-level date filtering)
      supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .gte('review_date', thisMonthStartStr)
        .lte('review_date', thisMonthEndStr)
        .order('review_date', { ascending: false }),

      // 3. Fetch reviews for last month (for comparison)
      supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .gte('review_date', lastMonthStartStr)
        .lte('review_date', lastMonthEndStr)
        .order('review_date', { ascending: false }),

      // 4. Fetch activities for all businesses
      supabase
        .from('activities')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false })
        .limit(10),

      // 5. Fetch business settings for first business (single business per user)
      supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', businessIds[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Check for errors in any query
    if (allReviewsResult.error) {
      throw new Error(`Failed to fetch all reviews: ${allReviewsResult.error.message}`);
    }
    if (reviewsThisMonthResult.error) {
      throw new Error(`Failed to fetch this month's reviews: ${reviewsThisMonthResult.error.message}`);
    }
    if (reviewsLastMonthResult.error) {
      throw new Error(`Failed to fetch last month's reviews: ${reviewsLastMonthResult.error.message}`);
    }
    if (activitiesResult.error) {
      throw new Error(`Failed to fetch activities: ${activitiesResult.error.message}`);
    }
    if (businessSettingsResult.error) {
      throw new Error(`Failed to fetch business settings: ${businessSettingsResult.error.message}`);
    }
    // Subscription error check removed - handled by centralized cache

    // Extract data from results
    const businesses = businessesData || [];
    const allReviews = allReviewsResult.data || [];
    const reviewsThisMonth = reviewsThisMonthResult.data || [];
    const reviewsLastMonth = reviewsLastMonthResult.data || [];
    const activities = activitiesResult.data || [];
    const businessSettings = businessSettingsResult.data;
    // Subscription data removed - handled by centralized cache

    // Calculate stats using the same logic as useDashboardData
    const calculateStats = (
      reviewsThisMonth: Review[],
      reviewsLastMonth: Review[],
      activities: Activity[],
      allReviews: Review[]
    ): DashboardStats => {
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
    };

    // Generate chart data using the same logic as useDashboardData
    const generateChartData = (reviews: Review[]): ChartDataPoint[] => {
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
    };

    // Generate onboarding steps using the same logic as useDashboardData
    const generateOnboardingSteps = (
      businesses: Business[], 
      businessSettings: BusinessSettings | null, 
      subscription: Subscription | null = null // Default to null
    ): OnboardingStep[] => {
      const hasGoogleConnection = businesses.some(b =>
        b.google_access_token && b.google_refresh_token && b.connection_status === 'connected'
      );
      const hasBrandVoiceSettings = Boolean(businessSettings?.brand_voice_preset);
      const hasAutoReplyEnabled = Boolean(businessSettings?.approval_mode && businessSettings.approval_mode !== 'manual');
      const hasPremiumPlan = Boolean(subscription && subscription.plan_id !== 'basic' && subscription.status === 'active');

      return [
        {
          id: 'connect-google',
          title: 'Connect your Google Business Profile',
          description: 'One-click connection to start syncing your reviews and managing replies automatically.',
          completed: hasGoogleConnection,
          actionText: 'Connect Now',
          action: () => {
            // Navigate to settings integrations tab
            window.location.href = '/settings?tab=integrations';
          }
        },
        {
          id: 'premium-plan',
          title: 'Choose a plan to use RepliFast',
          description: 'Upgrade to a premium plan to unlock features and save time with AI-powered automation.',
          completed: hasPremiumPlan,
          actionText: 'Choose Plan',
          action: () => {
            // Navigate to profile page with pricing
            window.location.href = '/profile';
          }
        },
        {
          id: 'brand-voice',
          title: 'Customize your brand voice',
          description: 'Set the tone and personality for AI-generated replies to match your business style.',
          completed: hasBrandVoiceSettings,
          actionText: 'Set Voice',
          action: () => {
            // Navigate to settings voice tab
            window.location.href = '/settings?tab=voice';
          }
        },
        {
          id: 'auto-replies',
          title: 'Enable smart automation',
          description: 'Let AI automatically generate and post replies to save you time while maintaining quality.',
          completed: hasAutoReplyEnabled,
          actionText: 'Turn On',
          action: () => {
            // Navigate to settings approval tab
            window.location.href = '/settings?tab=approval';
          }
        }
      ];
    };

    // Calculate all dashboard data
    const stats = calculateStats(reviewsThisMonth, reviewsLastMonth, activities, allReviews);
    const chartData = generateChartData(allReviews);
    const onboardingSteps = generateOnboardingSteps(businesses, businessSettings); // subscription removed

    const response: DashboardApiResponse = {
      businesses,
      stats,
      chartData,
      onboardingSteps
      // subscription removed - handled by centralized cache
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
