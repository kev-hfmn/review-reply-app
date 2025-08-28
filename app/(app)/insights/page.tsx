'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Mail,
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  Calendar,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Target,
  Award,
  Lock,
  MessageSquareText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useInsightsData, downloadBlob, type TimePeriodType } from '@/hooks/useInsightsData';
import { supabase } from '@/utils/supabase';
import type { Business } from '@/types/dashboard';
import { useSubscriptionQuery } from '@/hooks/queries/useSubscriptionQuery';
import { hasFeature } from '@/lib/utils/subscription-client';

export default function InsightsPage() {
  const { user } = useAuth();
  const subscriptionQuery = useSubscriptionQuery(user?.id || null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [currentPeriodType, setCurrentPeriodType] = useState<TimePeriodType>('monthly');

  const {
    insights,
    selectedPeriod,
    isLoading,
    isGenerating,
    error,
    hasData,
    lastGenerated,
    selectPeriod,
    regenerateInsights,
    getAvailablePeriods,
    exportInsights,
    sendEmail,
  } = useInsightsData(selectedBusinessId || undefined, undefined, currentPeriodType);

  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showPeriodSelector) {
        setShowPeriodSelector(false);
      }
    };

    if (showPeriodSelector) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPeriodSelector]);

  // Regenerate insights when period type changes
  useEffect(() => {
    if (selectedBusinessId) {
      // When period type changes, select current period for the new type
      selectPeriod(new Date(), currentPeriodType);
    }
  }, [currentPeriodType, selectedBusinessId, selectPeriod]);

  // Load businesses on mount
  useEffect(() => {
    const loadBusinesses = async () => {
      if (!user?.id) {
        setIsLoadingBusinesses(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching businesses:', error);
          return;
        }

        setBusinesses(data || []);

        // Auto-select first business if available
        if (data && data.length > 0 && !selectedBusinessId) {
          setSelectedBusinessId(data[0].id);
        }
      } catch (error) {
        console.error('Error loading businesses:', error);
      } finally {
        setIsLoadingBusinesses(false);
      }
    };

    loadBusinesses();
  }, [user?.id, selectedBusinessId]);

  const handleSendEmail = async () => {
    if (!user?.email || !insights) return;

    setIsSending(true);
    try {
      await sendEmail(user.email);
      // TODO: Show success toast
      console.log("Email Sent! Weekly insights has been sent to your email address.");
    } catch (error) {
      console.error('Email error:', error);
      // TODO: Show error toast
      console.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // PDF export not yet implemented
      console.log("PDF export coming soon!");
      // TODO: Implement PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('PDF error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!insights) return;

    try {
      const blob = await exportInsights('csv');
      const filename = `replifast-insights-${insights.week_start}.csv`;
      downloadBlob(blob, filename);
      console.log("CSV Downloaded! Your weekly insights data has been exported.");
    } catch (error) {
      console.error('CSV export error:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  // Check if user has access to advanced insights feature
  const hasInsightsAccess = subscriptionQuery.data ? hasFeature(subscriptionQuery.data.planId, 'advancedInsights') : false;
  const currentPlan = subscriptionQuery.data?.planId || 'basic';
  const planName = currentPlan === 'basic' ? 'Basic' : currentPlan === 'starter' ? 'Starter' : currentPlan === 'pro' ? 'Pro' : 'Pro Plus';
  
  // Show upgrade prompt for users without insights access
  if (!hasInsightsAccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Insights
          </h1>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Pro Plan Required
            </h3>
            <p className="text-muted-foreground mb-6">
              AI-powered insights require a Pro plan or higher. You&apos;re currently on the {planName} plan. Upgrade to access advanced analytics and insights for your reviews.
            </p>
            <Button
              onClick={() => window.location.href = '/profile'}
              className="bg-primary hover:bg-primary/90"
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingBusinesses || (isLoading && !insights)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Insights
          </h1>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
            <p className="text-muted-foreground">
              {isLoadingBusinesses ? 'Loading businesses...' :
               isGenerating ? 'Generating AI insights...' : 'Loading weekly insights...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No business selected state
  if (!selectedBusinessId || businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Weekly Insights
          </h1>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {businesses.length === 0 ? 'No businesses found' : 'Select a business'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {businesses.length === 0
                ? 'Connect your Google Business Profile to start generating weekly insights.'
                : 'Choose a business to view weekly insights.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !insights) {
    const isSubscriptionError = error.includes('Pro plan') || error.includes('subscription') || error.includes('require');
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Weekly Insights
          </h1>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            {isSubscriptionError ? (
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            ) : (
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-foreground mb-2">
              {isSubscriptionError ? 'Pro Plan Required' : 'Unable to Generate Insights'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            {isSubscriptionError ? (
              <Button
                onClick={() => window.location.href = '/profile'}
                className="bg-primary hover:bg-primary/90"
              >
                Upgrade to Pro
              </Button>
            ) : (
              <Button onClick={() => regenerateInsights()} disabled={isGenerating}>
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state - but still show filters
  if (!hasData && insights) {
    return (
      <div className="space-y-6">
        {/* Always-visible Filter Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-left gap-4">
                <div className="flex flex-col items-left gap-2">
                  <label className="text-sm font-light text-muted-foreground">Business</label>
                  <select
                    value={selectedBusinessId || ''}
                    onChange={(e) => setSelectedBusinessId(e.target.value || null)}
                    className="px-3 py-1 border rounded-md bg-background text-sm"
                    disabled={isLoadingBusinesses}
                  >
                    <option value="">Select business...</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col items-left gap-2">
                  <label className="text-sm font-light text-muted-foreground">Time Period</label>
                  <div className="flex items-center gap-2">
                    {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={currentPeriodType === type ? "pillActive" : "pill"}

                        onClick={() => setCurrentPeriodType(type)}
                        className="h-8 px-3 text-xs"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                    disabled={!selectedBusinessId}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedPeriod.label}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>

                  {showPeriodSelector && (
                    <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-50 min-w-48 max-h-64 overflow-y-auto">
                    {getAvailablePeriods(currentPeriodType).map((period) => (
                      <button
                        key={period.start.toISOString()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectPeriod(period.start, currentPeriodType);
                          setShowPeriodSelector(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-muted text-sm ${
                          period.start.getTime() === selectedPeriod.start.getTime()
                            ? 'bg-muted font-medium'
                            : ''
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateInsights()}
                  disabled={isGenerating || !selectedBusinessId}
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Analyzing...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {currentPeriodType.charAt(0).toUpperCase() + currentPeriodType.slice(1)} Insights
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-muted-foreground">
                {insights ? `${new Date(insights.week_start).toLocaleDateString()} - ${new Date(insights.week_end).toLocaleDateString()}` : selectedPeriod.label}
              </p>

              {lastGenerated && (
                <span className="text-xs text-muted-foreground">
                  Generated {lastGenerated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Reviews This {currentPeriodType === 'weekly' ? 'Week' :
                              currentPeriodType === 'monthly' ? 'Month' :
                              currentPeriodType === 'quarterly' ? 'Quarter' : 'Year'}
            </h3>
            <p className="text-muted-foreground mb-4">
              There are no reviews for the selected {currentPeriodType === 'weekly' ? 'week' :
                                                   currentPeriodType === 'monthly' ? 'month' :
                                                   currentPeriodType === 'quarterly' ? 'quarter' : 'year'}. Try selecting a different period or check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Always-visible Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-left gap-4">
              <div className="flex flex-col items-left gap-2">
                <label className="text-sm font-light text-muted-foreground">Business</label>
                <select
                  value={selectedBusinessId || ''}
                  onChange={(e) => setSelectedBusinessId(e.target.value || null)}
                  className="px-3 py-1 border rounded-md bg-background text-sm"
                  disabled={isLoadingBusinesses}
                >
                  <option value="">Select business...</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col items-left gap-2">
                <label className="text-sm font-light text-muted-foreground">Time Period</label>
                <div className="flex items-center gap-2">
                  {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={currentPeriodType === type ? "pillActive" : "pill"}

                      onClick={() => setCurrentPeriodType(type)}
                      className="h-8 px-3 text-xs"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-row items-center gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  disabled={!selectedBusinessId}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedPeriod.label}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>

                {showPeriodSelector && (
                  <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-50 min-w-48 max-h-64 overflow-y-auto">
                  {getAvailablePeriods(currentPeriodType).map((period) => (
                    <button
                      key={period.start.toISOString()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectPeriod(period.start, currentPeriodType);
                        setShowPeriodSelector(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-muted text-sm ${
                        period.start.getTime() === selectedPeriod.start.getTime()
                          ? 'bg-muted font-medium'
                          : ''
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateInsights()}
                disabled={isGenerating || !selectedBusinessId}
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {currentPeriodType.charAt(0).toUpperCase() + currentPeriodType.slice(1)} Insights
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">
              {insights ? `${new Date(insights.week_start).toLocaleDateString()} - ${new Date(insights.week_end).toLocaleDateString()}` : selectedPeriod.label}
            </p>

            {lastGenerated && (
              <span className="text-xs text-muted-foreground">
                Generated {lastGenerated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={isSending}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            disabled={!insights}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Reviews
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {insights?.stats.totalReviews ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {insights && getChangeIcon(insights.stats.weekOverWeekChange)}
                  {insights && (
                    <span className={`text-sm font-medium ${
                      insights.stats.weekOverWeekChange > 0 ? 'text-green-600' :
                      insights.stats.weekOverWeekChange < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {insights.stats.weekOverWeekChange > 0 ? '+' : ''}{insights.stats.weekOverWeekChange}%
                    </span>
                  )}
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Rating
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${insights ? getRatingColor(insights.stats.averageRating) : 'text-muted-foreground'}`}>
                      {insights?.stats.averageRating.toFixed(1) ?? '0.0'}
                    </p>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
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
          <Card>

            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Response Rate
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {insights?.stats.responseRate ?? 0}%
                  </p>
                </div>
                <MessageSquareText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Unique Customers
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {insights?.stats.uniqueCustomers ?? 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rating Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!insights || insights.stats.totalReviews === 0 ? (
                <p className="text-muted-foreground text-center py-4">No reviews to analyze</p>
              ) : (
                // Generate rating breakdown from actual review data
                [5, 4, 3, 2, 1].map((rating) => {
                  // Use actual rating breakdown from the digest service
                  const ratingBreakdown = insights.stats.ratingBreakdown || {};
                  const count = ratingBreakdown[rating.toString()] || 0;
                  const percentage = insights.stats.totalReviews > 0 ? (count / insights.stats.totalReviews) * 100 : 0;

                  // Debug logging
                  console.log(`⭐ Rating ${rating}: count=${count}, percentage=${percentage.toFixed(1)}%, width="${Math.max(0, Math.min(100, percentage))}%"`);
                  if (rating === 5) {
                    console.log('🔍 Rating breakdown debug:', ratingBreakdown);
                    console.log('📊 Total reviews:', insights.stats.totalReviews);
                    console.log('🧮 All percentages:', [5,4,3,2,1].map(r => {
                      const c = ratingBreakdown[r.toString()] || 0;
                      const p = insights.stats.totalReviews > 0 ? (c / insights.stats.totalReviews) * 100 : 0;
                      return `${r}⭐: ${c} (${p.toFixed(1)}%)`;
                    }));
                  }

                  // Only show ratings that have at least one review
                  if (count === 0) return null;

                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-background rounded-full h-2 relative overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500 absolute top-0 left-0"
                            style={{
                              width: `${Math.max(0, Math.min(100, percentage))}%`,
                              maxWidth: '100%'
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Love Points - What Customers Love Most */}
      {insights?.reviewAggregation?.customerLovePoints && insights.reviewAggregation.customerLovePoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                What Customers Love Most
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    {insights.reviewAggregation.customerLovePoints.map((lovePoint, index) => {
                      // Extract category and count from the love point text
                      const isBusinessCategory = lovePoint.includes('praised') || lovePoint.includes('Excellence') || lovePoint.includes('Quality');
                      const icon = isBusinessCategory ? Award : Star;
                      const IconComponent = icon;

                      // Generate tooltip content based on the love point category
                      const getTooltipContent = () => {
                        if (lovePoint.includes('Service Excellence')) {
                          return {
                            examples: ['"Excellent customer service from start to finish"', '"Outstanding support when I had questions"', '"Professional service exceeded expectations"'],
                            impact: 'Service excellence drives customer loyalty and word-of-mouth referrals',
                            action: 'Continue training staff in customer service best practices and recognize excellent service'
                          };
                        } else if (lovePoint.includes('Staff Quality')) {
                          return {
                            examples: ['"Friendly and helpful staff made the experience great"', '"Knowledgeable team answered all my questions"', '"Staff went above and beyond to help"'],
                            impact: 'Quality staff interactions create memorable experiences and repeat customers',
                            action: 'Invest in ongoing staff training and empowerment programs'
                          };
                        } else if (lovePoint.includes('Speed & Efficiency')) {
                          return {
                            examples: ['"Fast and efficient service"', '"Quick response time"', '"Prompt delivery exceeded expectations"'],
                            impact: 'Speed and efficiency reduce customer friction and increase satisfaction',
                            action: 'Optimize processes and consider quick-service recognition programs'
                          };
                        } else if (lovePoint.includes('Product Quality')) {
                          return {
                            examples: ['"High quality products that exceeded expectations"', '"Excellent craftsmanship and attention to detail"', '"Top-notch materials and construction"'],
                            impact: 'Product quality justifies premium pricing and builds brand reputation',
                            action: 'Maintain quality standards and showcase quality in marketing materials'
                          };
                        } else {
                          return {
                            examples: ['"Great experience overall"', '"Amazing service and quality"', '"Highly recommended"'],
                            impact: 'Positive customer experiences drive reviews and referrals',
                            action: 'Continue delivering consistent quality experiences'
                          };
                        }
                      };

                      const tooltipData = getTooltipContent();

                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger>
                            <Badge
                              variant="positive"
                              className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer hover:scale-105"
                            >
                              <IconComponent className="h-3 w-3 mr-1" />
                              {lovePoint}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4">
                            <div className="space-y-3">
                              <div className="font-semibold text-sm flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                                {lovePoint}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-green-600 mb-2">Customer Examples:</p>
                                <div className="space-y-1">
                                  {tooltipData.examples.map((example, i) => (
                                    <p key={i} className="text-xs text-muted-foreground italic pl-2 border-l-2 border-green-200">
                                      {example}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong className="text-blue-600">Business Impact:</strong> {tooltipData.impact}
                              </div>
                              <div className="text-xs text-purple-600 font-medium">
                                <strong>How to Leverage:</strong> {tooltipData.action}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>

              {/* Most Discussed Topics - Compact */}
              {insights.reviewAggregation.commonThemes && insights.reviewAggregation.commonThemes.length > 0 && (
                <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Most Discussed Topics</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insights.reviewAggregation.commonThemes.slice(0, 8).map((theme, index) => {
                      const percentage = (theme.frequency / insights.stats.totalReviews) * 100;
                      const ratingColor = theme.avgRating >= 4.5 ? 'text-emerald-600' : theme.avgRating >= 4 ? 'text-blue-600' : 'text-amber-600';
                      const badgeColor = theme.avgRating >= 4.5 ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' :
                                        theme.avgRating >= 4 ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' :
                                        'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';

                      return (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="secondary"
                                className={`${badgeColor} transition-colors cursor-pointer hover:scale-105 flex items-center gap-1`}
                              >
                                <span className="capitalize">{theme.theme}</span>
                                <span className="text-xs opacity-75">
                                  ({theme.frequency})
                                </span>
                                <div className="flex items-center gap-1 ml-1">
                                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                  <span className={`text-xs font-medium ${ratingColor}`}>
                                    {theme.avgRating.toFixed(1)}
                                  </span>
                                </div>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm p-4">
                              <div className="space-y-2">
                                <div className="font-semibold text-sm flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-blue-600" />
                                  {theme.theme.charAt(0).toUpperCase() + theme.theme.slice(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <strong>Frequency:</strong> {theme.frequency} mentions ({percentage.toFixed(0)}% of reviews)
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <strong>Average Rating:</strong> {theme.avgRating.toFixed(1)} stars
                                </div>
                                {theme.examples && theme.examples.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-green-600 mb-1">Customer Examples:</p>
                                    <div className="space-y-1">
                                      {theme.examples.slice(0, 2).map((example, i) => (
                                        <p key={i} className="text-xs text-muted-foreground italic pl-2 border-l-2 border-green-200">
                                          &ldquo;{example}&rdquo;
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs text-blue-600">
                                  <strong>Business Insight:</strong> This topic is {theme.avgRating >= 4.5 ? 'a major strength' : theme.avgRating >= 4 ? 'performing well' : 'needs attention'}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Strengths & Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!insights || insights.positiveThemes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No positive themes identified for this period.</p>
                ) : (
                  <TooltipProvider>
                    <div className="flex flex-wrap gap-2">
                      {insights.positiveThemes.map((theme, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger>
                            <Badge
                              variant="positive"
                              className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200 transition-colors cursor-pointer hover:scale-105"
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {theme.theme}
                              {theme.affectedCustomerCount > 1 && (
                                <span className="ml-1 text-xs opacity-75">
                                  ({theme.affectedCustomerCount})
                                </span>
                              )}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-4">
                            <div className="space-y-2">
                              <div className="font-semibold text-sm flex items-center gap-1">
                                <Award className="h-4 w-4 text-green-600" />
                                {theme.theme}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Customer Praise:</strong> &ldquo;{theme.specificExample}&rdquo;
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Business Impact:</strong> {theme.impactAssessment}
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                <strong>How to Leverage:</strong> {theme.recommendedAction}
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                                <span>Affected: <strong>{theme.affectedCustomerCount} customers</strong></span>
                                <span>Confidence: <strong>{Math.round(theme.confidence * 100)}%</strong></span>
                              </div>
                              <div className="text-xs text-blue-600">
                                <strong>Growth Opportunity:</strong> {theme.potentialROI}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Improvement Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!insights || insights.improvementThemes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No improvement areas identified for this period.</p>
                ) : (
                  <TooltipProvider>
                    <div className="flex flex-wrap gap-2">
                      {insights.improvementThemes.map((theme, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger>
                            <Badge
                              variant="negative"
                              className={`border transition-colors cursor-pointer hover:scale-105 ${
                                theme.priority === 'critical'
                                  ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' :
                                theme.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                              }`}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              {theme.theme}
                              {theme.affectedCustomerCount > 1 && (
                                <span className="ml-1 text-xs opacity-75">
                                  ({theme.affectedCustomerCount})
                                </span>
                              )}
                              {theme.priority === 'critical' && (
                                <span className="ml-1 text-xs font-bold">!</span>
                              )}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-4">
                            <div className="space-y-2">
                              <div className="font-semibold text-sm">{theme.theme}</div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Customer Example:</strong> &ldquo;{theme.specificExample}&rdquo;
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Business Impact:</strong> {theme.impactAssessment}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                <strong>Recommended Action:</strong> {theme.recommendedAction}
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                                <span>Priority: <strong>{theme.priority}</strong></span>
                                <span>Effort: <strong>{theme.implementationComplexity}</strong></span>
                              </div>
                              <div className="text-xs text-green-600">
                                <strong>Potential ROI:</strong> {theme.potentialROI}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Review Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!insights || insights.highlights.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No review highlights for this period.</p>
                </div>
              ) : (
                insights.highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
                      highlight.type === 'best'
                        ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 border-emerald-200 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/20 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                        : highlight.type === 'worst'
                        ? 'bg-gradient-to-br from-red-50 via-rose-50 to-red-50 border-red-200 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-900/20 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600'
                        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-blue-200 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                          highlight.type === 'best'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                            : highlight.type === 'worst'
                            ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                        }`}>
                          {highlight.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground text-base">
                            {highlight.customer_name}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: highlight.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - highlight.rating }).map((_, i) => (
                              <Star key={i + highlight.rating} className="h-4 w-4 text-gray-300" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={highlight.type === 'best' ? 'default' : highlight.type === 'worst' ? 'destructive' : 'secondary'}
                        className={`px-3 py-1 font-medium ${
                          highlight.type === 'best' ? 'bg-emerald-600 hover:bg-emerald-700' :
                          highlight.type === 'worst' ? 'bg-red-600 hover:bg-red-700' :
                          'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {highlight.type === 'best' ? '🏆 Top Review' :
                         highlight.type === 'worst' ? '⚠️ Needs Attention' : '📌 Notable'}
                      </Badge>
                    </div>

                    {/* Review Text */}
                    <div className="px-6 pb-4">
                      <blockquote className="text-foreground text-sm leading-relaxed italic border-l-4 border-current border-opacity-30 pl-4 py-2">
                        &ldquo;{highlight.review_text}&rdquo;
                      </blockquote>
                    </div>

                    {/* Business Intelligence */}
                    <div className="px-6 pb-6">
                      <div className={`p-4 rounded-lg border ${
                        highlight.type === 'best'
                          ? 'bg-white/80 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800'
                          : highlight.type === 'worst'
                          ? 'bg-white/80 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                          : 'bg-white/80 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
                      }`}>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <p className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                                Business Impact
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{highlight.businessValue}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              <Award className="h-4 w-4 text-purple-600" />
                              <p className="text-xs font-bold text-purple-800 dark:text-purple-200 uppercase tracking-wide">
                                Recommended Action
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{highlight.actionImplication}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-current border-opacity-10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">
                              📊 Represents ~{Math.round(highlight.representativeness * 100)}% of similar customer sentiment
                            </span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              highlight.type === 'best'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                                : highlight.type === 'worst'
                                ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                            }`}>
                              {highlight.type === 'best' ? 'Leverage' : highlight.type === 'worst' ? 'Address' : 'Monitor'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
