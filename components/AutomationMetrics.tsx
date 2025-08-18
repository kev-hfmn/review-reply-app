'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  Send,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationMetricsData {
  // Daily metrics for today
  today: {
    reviewsProcessed: number;
    repliesGenerated: number;
    autoApproved: number;
    autoPosted: number;
    emailsSent: number;
    errorCount: number;
    successRate: number;
  };
  // Weekly metrics for comparison
  thisWeek: {
    reviewsProcessed: number;
    repliesGenerated: number;
    autoApproved: number;
    autoPosted: number;
    emailsSent: number;
    errorCount: number;
    successRate: number;
  };
  lastWeek: {
    reviewsProcessed: number;
    repliesGenerated: number;
    autoApproved: number;
    autoPosted: number;
    emailsSent: number;
    errorCount: number;
    successRate: number;
  };
  // Performance insights
  performance: {
    avgResponseTime: number; // in minutes
    peakHours: string[];
    automationUptime: number; // percentage
    errorCategories: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  // Automation effectiveness
  effectiveness: {
    autoApprovalRate: number; // percentage of replies auto-approved
    manualInterventionRate: number; // percentage requiring manual review
    timesSaved: number; // estimated hours saved
    totalAutomatedActions: number;
  };
}

interface AutomationMetricsProps {
  businessId: string;
  timeRange?: '24h' | '7d' | '30d';
  showDetailedBreakdown?: boolean;
}

export default function AutomationMetrics({ 
  businessId, 
  timeRange = '24h',
  showDetailedBreakdown = true 
}: AutomationMetricsProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AutomationMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!user || !businessId) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/automation/metrics?businessId=${businessId}&userId=${user.id}&timeRange=${timeRange}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load automation metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading automation metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [businessId, user, timeRange]);

  const calculateChange = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'same' } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    };
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'same') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <Card className="text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Automation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading metrics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Automation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error || 'Failed to load metrics'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const todayVsWeek = {
    reviewsProcessed: calculateChange(metrics.today.reviewsProcessed, metrics.lastWeek.reviewsProcessed),
    repliesGenerated: calculateChange(metrics.today.repliesGenerated, metrics.lastWeek.repliesGenerated),
    autoApproved: calculateChange(metrics.today.autoApproved, metrics.lastWeek.autoApproved),
    autoPosted: calculateChange(metrics.today.autoPosted, metrics.lastWeek.autoPosted),
    successRate: calculateChange(metrics.today.successRate, metrics.lastWeek.successRate)
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Reviews Processed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.today.reviewsProcessed}
                  </p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(todayVsWeek.reviewsProcessed.direction)}
                    <span className={`text-xs ml-1 ${
                      todayVsWeek.reviewsProcessed.direction === 'up' ? 'text-green-600' : 
                      todayVsWeek.reviewsProcessed.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {todayVsWeek.reviewsProcessed.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Replies Generated</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.today.repliesGenerated}
                  </p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(todayVsWeek.repliesGenerated.direction)}
                    <span className={`text-xs ml-1 ${
                      todayVsWeek.repliesGenerated.direction === 'up' ? 'text-green-600' : 
                      todayVsWeek.repliesGenerated.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {todayVsWeek.repliesGenerated.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Auto-Posted</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.today.autoPosted}
                  </p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(todayVsWeek.autoPosted.direction)}
                    <span className={`text-xs ml-1 ${
                      todayVsWeek.autoPosted.direction === 'up' ? 'text-green-600' : 
                      todayVsWeek.autoPosted.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {todayVsWeek.autoPosted.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Success Rate</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.today.successRate.toFixed(1)}%
                  </p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(todayVsWeek.successRate.direction)}
                    <span className={`text-xs ml-1 ${
                      todayVsWeek.successRate.direction === 'up' ? 'text-green-600' : 
                      todayVsWeek.successRate.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {todayVsWeek.successRate.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {showDetailedBreakdown && (
        <>
          {/* Performance Insights */}
          <Card className="text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Automation Uptime
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {metrics.performance.automationUptime.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.performance.automationUptime} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Avg Response Time
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatDuration(metrics.performance.avgResponseTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      From review to reply
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Peak Hours
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {metrics.performance.peakHours.map((hour, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Effectiveness Metrics */}
          <Card className="text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Automation Effectiveness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.effectiveness.autoApprovalRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Auto-Approval Rate</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.effectiveness.manualInterventionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manual Review Required</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.effectiveness.timesSaved.toFixed(1)}h
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Time Saved</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {metrics.effectiveness.totalAutomatedActions.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Automated Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Analysis */}
          {metrics.performance.errorCategories.length > 0 && (
            <Card className="text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Error Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.performance.errorCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {category.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {category.count} errors
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {category.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}