"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useDashboardDataOptimized } from '@/hooks/useDashboardDataOptimized';
import { motion } from 'framer-motion';
import type { Business } from '@/types/dashboard';
import { Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  createMetrics,
  convertActivitiesToDashboard,
  getEmptyStateMetrics
} from '@/utils/dashboard';
import OnboardingCard from '@/components/OnboardingCard';
import ReviewsChart from '@/components/ReviewsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AUTH_TIMEOUT = 15000; // 15 seconds

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { subscription, fetchSubscription } = useSubscription();
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  // Removed trial system - users are either basic or premium subscribers
  const [authTimeout, setAuthTimeout] = useState(false);

  // Debug user ID (only once when user changes)
  useEffect(() => {
    if (user?.id) {
      console.log('Dashboard: Current user ID:', user.id);
    }
  }, [user?.id]);

  // Fetch dashboard data using optimized hook
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch
  } = useDashboardDataOptimized();

  // Extract data from optimized response
  const businesses = dashboardData?.businesses || [];
  const stats = dashboardData?.stats || null;
  const chartData = dashboardData?.chartData || [];
  const onboardingSteps = dashboardData?.onboardingSteps || [];

  // Temporarily disabled subscription checks for MVP development
  // TODO: Re-enable subscription gating in production

  // Add refresh effect
  useEffect(() => {
    const refreshSubscription = async () => {
      await fetchSubscription();
      setHasCheckedSubscription(true);
    };

    if (user?.id) {
      refreshSubscription();
    }
  }, [user?.id, fetchSubscription]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && isAuthLoading) {
        setAuthTimeout(true);
      }
    }, AUTH_TIMEOUT);

    return () => clearTimeout(timer);
  }, [user, isAuthLoading]);

  // Update the loading check
  if (!user && isAuthLoading && !hasCheckedSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4 mx-auto"></div>
          <p className="text-foreground">
            {authTimeout ?
              "Taking longer than usual? Try refreshing the page 😊." :
              "Verifying access..."}
          </p>
        </div>
      </div>
    );
  }

  // Get metrics data - use stats if available, otherwise show empty state
  const dashboardMetrics = stats
    ? createMetrics(
        stats.reviewsThisWeek,
        stats.reviewsThisWeekChange,
        stats.repliesPosted,
        stats.repliesPostedChange,
        stats.avgRating,
        stats.avgRatingChange,
        stats.pendingApprovals,
        stats.pendingApprovalsChange
      )
    : getEmptyStateMetrics();

  // Convert activities for display
  const recentActivity = stats?.recentActivities
    ? convertActivitiesToDashboard(stats.recentActivities)
    : [];

  // Handle dashboard error
  if (dashboardError) {
    const errorMessage = dashboardError instanceof Error ? dashboardError.message : 'Unknown error occurred';
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Your Reviews
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error loading dashboard data: {errorMessage}
          </p>
          <Button
            onClick={() => refetch()}
            variant="link"
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm p-0 h-auto"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your Reviews
          </h1>
          {businesses.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Managing {businesses.length} business{businesses.length > 1 ? 'es' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {subscription?.status === 'active' && subscription?.plan_id && subscription.plan_id !== 'basic' ?
              `${subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1).replace('-', ' ')} User` :
              'Basic User'
            }
          </span>
          {isDashboardLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
        </div>
      </div>

      {/* Show onboarding for basic users who haven't completed Google integration setup */}
      {(() => {
        // Show onboarding for basic plan users who don't have Google integration complete
        const hasGoogleIntegration = businesses.some((b: Business) => b.google_access_token && b.google_refresh_token);
        const isBasicUser = !subscription || subscription.plan_id === 'basic' || subscription.status !== 'active';
        const shouldShowOnboarding = isBasicUser && !hasGoogleIntegration;

        return shouldShowOnboarding && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <OnboardingCard
              steps={onboardingSteps}
              onStepAction={(stepId) => {
                console.log('Onboarding step clicked:', stepId);
                // Navigate based on step ID
                switch (stepId) {
                  case 'connect-google':
                    window.location.href = '/settings?tab=integrations';
                    break;
                  case 'premium-plan':
                    window.location.href = '/profile';
                    break;
                  case 'brand-voice':
                    window.location.href = '/settings?tab=voice';
                    break;
                  case 'auto-replies':
                    window.location.href = '/settings?tab=approval';
                    break;
                  default:
                    console.log('Unknown step ID:', stepId);
                }
              }}
            />
            <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-6 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to RepliFast! 👋
              </h3>

              {subscription?.plan_id === 'basic' && (
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Start by connecting your Google Business Profile with one click and manage reviews with AI-powered replies instantly. We use the official secure Google login to connect your Google Business Profile.
                  </p>
                  <div>
                    <p className="font-medium mb-2">Upgrade to a premium plan to unlock all features:</p>
                    <div className="space-y-1 text-sm">
                      <p>✅ Import and reply to all your past reviews</p>
                      <p>✅ Automate replies for every new review</p>
                      <p>✅ Customize your brand voice for consistent messaging</p>
                    </div>
                  </div>
                  <p>
                    Get set up in minutes and start turning reviews into customer trust today.
                  </p>
                  <p>Any questions, feedback or suggestions? <Link href="/contact" className="underline">Click here</Link> to send us a message. We&apos;re here to help!</p>
                  <p className="italic">Enjoy using RepliFast!</p>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent>
            <div className="flex items-center justify-between pt-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                {metric.icon}
              </div>
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-500' :
                metric.trend === 'down' ? 'text-red-500' :
                'text-muted-foreground'
              }`}>
                {metric.change}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-foreground">
              {metric.value}
            </h3>
            <p className="text-sm text-muted-foreground">
              {metric.title}
            </p>
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground">
                {metric.subtitle}
              </p>
            )}
            </CardContent>
              </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <ReviewsChart data={chartData} isLoading={isDashboardLoading} />
        </div>

        {/* Recent Activity */}

        <Card>
          <CardHeader>
            <CardTitle>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Activity className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No activity yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity will appear here as you manage reviews
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3 text-sm"
                >
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-relaxed">
                      {activity.action}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
