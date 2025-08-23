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
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useDigestData, downloadBlob, type TimePeriodType } from '@/hooks/useDigestData';
import { supabase } from '@/utils/supabase';
import type { Business } from '@/types/dashboard';

export default function DigestPage() {
  const { user, isSubscriber } = useAuth();
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
    confidenceScore,
    lastGenerated,
    selectPeriod,
    regenerateInsights,
    getAvailablePeriods,
    exportInsights,
    sendEmail,
  } = useDigestData(selectedBusinessId || undefined, undefined, currentPeriodType);

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
      console.log("Email Sent! Weekly digest has been sent to your email address.");
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
      const filename = `flowrise-digest-${insights.week_start}.csv`;
      downloadBlob(blob, filename);
      console.log("CSV Downloaded! Your weekly digest data has been exported.");
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

  // Show upgrade prompt for basic users
  if (!isSubscriber) {
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
              Subscription Required
            </h3>
            <p className="text-muted-foreground mb-6">
              AI-powered insights are available to subscribers. Upgrade your plan to access this feature and to analyze your reviews at a glance.
            </p>
            <Button
              onClick={() => window.location.href = '/profile'}
              className="bg-primary hover:bg-primary/90"
            >
              Upgrade Plan
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
               isGenerating ? 'Generating AI insights...' : 'Loading weekly digest...'}
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
                : 'Choose a business to view weekly digest insights.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !insights) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Weekly Insights
          </h1>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Unable to Generate Insights
            </h3>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={() => regenerateInsights()} disabled={isGenerating}>
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!hasData && insights) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Weekly Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedPeriod.label}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Reviews This Week
            </h3>
            <p className="text-muted-foreground mb-4">
              There are no reviews for the selected week. Try selecting a different week or check back later.
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
                      variant={currentPeriodType === type ? "default" : "outline"}
                      size="sm"
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
            {currentPeriodType.charAt(0).toUpperCase() + currentPeriodType.slice(1)} Digest
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
                <MessageSquare className="h-8 w-8 text-blue-600" />
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
                  <div className="flex flex-wrap gap-2">
                    {insights.positiveThemes.map((theme, index) => (
                      <Badge
                        key={index}
                        variant="positive"
                        className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200 transition-colors cursor-default"
                        title={`${theme.specificExample} - ${theme.recommendedAction}`}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {theme.theme}
                        {theme.affectedCustomerCount > 1 && (
                          <span className="ml-1 text-xs opacity-75">
                            ({theme.affectedCustomerCount})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
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
                  <div className="flex flex-wrap gap-2">
                    {insights.improvementThemes.map((theme, index) => (
                      <Badge
                        key={index}
                        variant="negative"
                        className={`border transition-colors cursor-default ${
                          theme.priority === 'critical'
                            ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' :
                          theme.priority === 'high'
                            ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                        }`}
                        title={`${theme.specificExample} - ${theme.recommendedAction} (${theme.implementationComplexity} effort)`}
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
                    ))}
                  </div>
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
            <CardTitle>Review Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!insights || insights.highlights.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No review highlights for this week.</p>
              ) : (
                insights.highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      highlight.type === 'best'
                        ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600'
                        : highlight.type === 'worst'
                        ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600'
                        : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {highlight.customer_name}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: highlight.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant={highlight.type === 'best' ? 'default' : 'destructive'}
                        className={highlight.type === 'best' ? 'bg-green-600' : ''}
                      >
                        {highlight.type === 'best' ? 'Top Review' :
                         highlight.type === 'worst' ? 'Needs Attention' : 'Notable'}
                      </Badge>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed mb-3">
                      &ldquo;{highlight.review_text}&rdquo;
                    </p>
                    <div className="bg-white dark:bg-gray-800/50 p-3 rounded border">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Business Impact:
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">{highlight.businessValue}</p>
                      <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">
                        Recommended Action:
                      </p>
                      <p className="text-xs text-muted-foreground">{highlight.actionImplication}</p>
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Represents ~{Math.round(highlight.representativeness * 100)}% of similar customer sentiment
                        </span>
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
