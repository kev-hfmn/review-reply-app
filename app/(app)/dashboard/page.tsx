"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useDashboardData } from '@/hooks/useDashboardData';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { 
  createMetrics, 
  convertActivitiesToDashboard, 
  getEmptyStateMetrics 
} from '@/utils/dashboard';
import OnboardingCard from '@/components/OnboardingCard';
import ReviewsChart from '@/components/ReviewsChart';

const AUTH_TIMEOUT = 15000; // 15 seconds

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { fetchSubscription } = useSubscription();
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { isInTrial, isLoading: isTrialLoading } = useTrialStatus();
  const [authTimeout, setAuthTimeout] = useState(false);
  
  // Fetch dashboard data
  const { 
    businesses, 
    stats, 
    chartData, 
    onboardingSteps, 
    isLoading: isDashboardLoading, 
    error: dashboardError,
    refetch
  } = useDashboardData();

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
    if (user?.id) {
      // Check if user has completed onboarding
      const checkOnboarding = async () => {
        const { data } = await supabase
          .from('user_preferences')
          .select('has_completed_onboarding')
          .eq('user_id', user.id)
          .single();
        
        setHasCompletedOnboarding(!!data?.has_completed_onboarding);
      };
      
      checkOnboarding();
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && (isAuthLoading || isTrialLoading)) {
        setAuthTimeout(true);
      }
    }, AUTH_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [user, isAuthLoading, isTrialLoading]);

  // Update the loading check
  if (!user && (isAuthLoading || isTrialLoading) && !hasCheckedSubscription) {
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Flowrise Reviews
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error loading dashboard data: {dashboardError}
          </p>
          <button 
            onClick={refetch}
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Flowrise Reviews
          </h1>
          {businesses.length > 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Managing {businesses.length} business{businesses.length > 1 ? 'es' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {isInTrial ? "Trial Period" : "Premium Plan"}
          </span>
          {isDashboardLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
        </div>
      </div>

      {/* Show onboarding for new users */}
      {businesses.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <OnboardingCard 
            steps={onboardingSteps} 
            onStepAction={(stepId) => {
              console.log('Onboarding step clicked:', stepId);
              // TODO: Handle onboarding step actions
            }}
          />
          <div className="bg-gradient-to-r from-primary/10 to-primary/20 dark:from-primary/5 dark:to-primary/10 rounded-xl p-6 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Welcome to Flowrise Reviews! 👋
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Start by connecting your Google Business account to automatically manage your reviews with AI-powered replies.
            </p>
            <div className="text-sm text-slate-500 dark:text-slate-500">
              <strong>Next:</strong> Complete the setup steps to get started
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary/10 dark:bg-primary-light/10 rounded-lg">
                {metric.icon}
              </div>
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-500' : 
                metric.trend === 'down' ? 'text-red-500' : 
                'text-slate-500'
              }`}>
                {metric.change}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
              {metric.value}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {metric.title}
            </p>
            {metric.subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {metric.subtitle}
              </p>
            )}
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
        <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            Recent Activity
          </h3>
          
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No activity yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
                  <div className="p-2 bg-primary/10 dark:bg-primary-light/10 rounded-lg flex-shrink-0 mt-0.5">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white leading-relaxed">
                      {activity.action}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Onboarding for existing users */}
      {businesses.length > 0 && onboardingSteps.some(step => !step.completed) && (
        <OnboardingCard 
          steps={onboardingSteps} 
          onStepAction={(stepId) => {
            console.log('Onboarding step clicked:', stepId);
            // TODO: Handle onboarding step actions
          }}
        />
      )}
    </div>
  );
}