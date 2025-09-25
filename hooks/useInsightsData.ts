import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInsightsCacheInvalidation } from '@/hooks/queries/useInsightsQueries';
import type { 
  WeeklyDigestInsights,
  DigestStats,
  ActionableTheme,
  ReviewHighlight,
  ReviewAggregation,
  KeywordFrequency,
} from '@/lib/services/insightsService';

// Time period selection types
export type TimePeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface TimePeriodSelection {
  type: TimePeriodType;
  start: Date;
  end: Date;
  label: string;
}

export function useInsightsData(businessId?: string, initialPeriod?: Date, initialType: TimePeriodType = 'monthly') {
  const { user } = useAuth();
  const { invalidateInsightsCache } = useInsightsCacheInvalidation();
  
  // State management
  const [insights, setInsights] = useState<WeeklyDigestInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodSelection>(() => 
    getTimePeriodSelection(initialPeriod || new Date(), initialType)
  );

  /**
   * Generate insights for the selected week
   */
  const generateInsights = useCallback(async (forceRegenerate = false) => {
    if (!user?.id || !businessId) {
      setIsLoading(false);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          weekStart: selectedPeriod.start.toISOString(),
          weekEnd: selectedPeriod.end.toISOString(),
          forceRegenerate,
          userId: user.id,
          periodType: selectedPeriod.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();

      if (data.success && data.insights) {
        setInsights(data.insights);
        // Invalidate TanStack Query cache so other components get fresh data
        if (businessId) {
          invalidateInsightsCache(businessId, selectedPeriod.start);
        }
      } else {
        throw new Error(data.message || 'No insights received');
      }

    } catch (err) {
      console.error('Error generating insights:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(errorMessage);
      
      // Don't set fallback insights for subscription errors - let the error show
      if (!errorMessage.includes('Pro plan') && !errorMessage.includes('subscription')) {
        setInsights(generateFallbackInsights(businessId, selectedPeriod));
      }
      
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  }, [user?.id, businessId, selectedPeriod]);

  /**
   * Change the selected time period and regenerate insights
   */
  const selectPeriod = useCallback((start: Date, type: TimePeriodType) => {
    const newPeriod = getTimePeriodSelection(start, type);
    setSelectedPeriod(newPeriod);
    setInsights(null); // Clear current insights
    setError(null);
  }, []);

  const selectCustomPeriod = useCallback((start: Date, end: Date) => {
    const newPeriod: TimePeriodSelection = {
      type: 'custom',
      start,
      end,
      label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    };
    setSelectedPeriod(newPeriod);
    setInsights(null);
    setError(null);
  }, []);

  /**
   * Regenerate insights with force flag
   */
  const regenerateInsights = useCallback(() => {
    generateInsights(true);
  }, [generateInsights]);

  /**
   * Get available period options for selection
   */
  const getAvailablePeriods = useCallback((type: TimePeriodType): TimePeriodSelection[] => {
    const periods: TimePeriodSelection[] = [];
    const today = new Date();
    
    const count = type === 'weekly' ? 8 : type === 'monthly' ? 12 : type === 'quarterly' ? 4 : 3; // 3 years for yearly
    
    for (let i = 0; i < count; i++) {
      let periodStart = new Date(today);
      
      switch (type) {
        case 'weekly':
          const dayOfWeek = today.getDay();
          periodStart.setDate(today.getDate() - dayOfWeek - (i * 7));
          break;
        case 'monthly':
          periodStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
          break;
        case 'quarterly':
          const currentQuarter = Math.floor(today.getMonth() / 3);
          const quarterStart = (currentQuarter - i) * 3;
          periodStart = new Date(today.getFullYear(), quarterStart, 1);
          if (quarterStart < 0) {
            periodStart = new Date(today.getFullYear() - 1, quarterStart + 12, 1);
          }
          break;
        case 'yearly':
          periodStart = new Date(today.getFullYear() - i, 0, 1);
          break;
      }
      
      periods.push(getTimePeriodSelection(periodStart, type));
    }
    
    return periods;
  }, []);

  /**
   * Export insights data in different formats
   */
  const exportInsights = useCallback(async (format: 'csv' | 'pdf' | 'json') => {
    if (!insights) {
      throw new Error('No insights available to export');
    }

    try {
      switch (format) {
        case 'csv':
          return exportToCSV(insights);
        case 'json':
          return exportToJSON(insights);
        case 'pdf':
          // PDF export would need additional implementation
          throw new Error('PDF export not yet implemented');
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [insights]);

  /**
   * Send insights via email (placeholder for future implementation)
   */
  const sendEmail = useCallback(async (emailAddress: string) => {
    if (!insights) {
      throw new Error('No insights available to send');
    }

    try {
      // Placeholder for email functionality
      console.log('Sending email to:', emailAddress);
      console.log('Insights:', insights);
      
      // In a real implementation, this would call an email API
      return { success: true, message: 'Email sent successfully' };
      
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }, [insights]);

  // NOTE: Automatic generation removed - insights are now loaded via TanStack Query cache
  // Manual generation still available via regenerateInsights() function

  return {
    // Data
    insights,
    selectedPeriod,
    
    // State
    isLoading,
    isGenerating,
    error,
    
    // Actions
    generateInsights,
    regenerateInsights,
    selectPeriod,
    selectCustomPeriod,
    getAvailablePeriods,
    exportInsights,
    sendEmail,
    
    // Computed values
    hasData: !!insights && insights.stats.totalReviews > 0,
    confidenceScore: insights?.overallConfidence || 0,
    lastGenerated: insights?.generated_at ? new Date(insights.generated_at) : null,
  };
}

/**
 * Get time period selection object from a date and type
 */
function getTimePeriodSelection(date: Date, type: TimePeriodType): TimePeriodSelection {
  let start: Date, end: Date, label: string;

  switch (type) {
    case 'weekly':
      start = new Date(date);
      const dayOfWeek = date.getDay();
      start.setDate(date.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      const isCurrentWeek = isDateInCurrentWeek(date);
      const isLastWeek = isDateInPreviousWeek(date);
      
      if (isCurrentWeek) {
        label = 'This Week';
      } else if (isLastWeek) {
        label = 'Last Week';
      } else {
        label = `Week of ${start.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        })}`;
      }
      break;

    case 'monthly':
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      
      const now = new Date();
      const isCurrentMonth = start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
      const isLastMonth = start.getMonth() === (now.getMonth() - 1) && start.getFullYear() === now.getFullYear();
      
      if (isCurrentMonth) {
        label = 'This Month';
      } else if (isLastMonth) {
        label = 'Last Month';
      } else {
        label = start.toLocaleDateString('en-US', { 
          month: 'long',
          year: start.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
      break;

    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      start = new Date(date.getFullYear(), quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
      end.setHours(23, 59, 59, 999);
      
      const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
      label = `${quarterNames[quarter]} ${date.getFullYear()}`;
      break;

    case 'yearly':
      start = new Date(date.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(date.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      
      const currentYear = new Date().getFullYear();
      if (date.getFullYear() === currentYear) {
        label = 'This Year';
      } else if (date.getFullYear() === currentYear - 1) {
        label = 'Last Year';
      } else {
        label = date.getFullYear().toString();
      }
      break;

    case 'custom':
    default:
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
      label = date.toLocaleDateString();
      break;
  }

  return { type, start, end, label };
}

/**
 * Check if date is in current week
 */
function isDateInCurrentWeek(date: Date): boolean {
  const now = new Date();
  const currentWeekStart = new Date(now);
  const dayOfWeek = now.getDay();
  currentWeekStart.setDate(now.getDate() - dayOfWeek);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);
  
  return date >= currentWeekStart && date <= currentWeekEnd;
}

/**
 * Check if date is in previous week
 */
function isDateInPreviousWeek(date: Date): boolean {
  const now = new Date();
  const lastWeekStart = new Date(now);
  const dayOfWeek = now.getDay();
  lastWeekStart.setDate(now.getDate() - dayOfWeek - 7);
  lastWeekStart.setHours(0, 0, 0, 0);
  
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
  lastWeekEnd.setHours(23, 59, 59, 999);
  
  return date >= lastWeekStart && date <= lastWeekEnd;
}

/**
 * Generate fallback insights when API fails
 */
function generateFallbackInsights(
  businessId: string,
  period: TimePeriodSelection
): WeeklyDigestInsights {
  return {
    id: 'fallback-' + Date.now(),
    business_id: businessId,
    week_start: period.start.toISOString().split('T')[0],
    week_end: period.end.toISOString().split('T')[0],
    stats: {
      totalReviews: 0,
      averageRating: 0,
      responseRate: 0,
      weekOverWeekChange: 0,
      uniqueCustomers: 0,
      satisfactionDrivers: [],
    },
    positiveThemes: [],
    improvementThemes: [{
      theme: 'Service temporarily unavailable',
      specificExample: 'Unable to analyze reviews at this time',
      impactAssessment: 'Temporary technical issue',
      recommendedAction: 'Please try again later or contact support',
      priority: 'medium',
      affectedCustomerCount: 0,
      implementationComplexity: 'simple',
      potentialROI: 'System restoration',
      confidence: 1.0,
    }],
    highlights: [],
    competitiveInsights: {
      competitorMentions: [],
      uniqueValueProps: [],
      marketPositioning: {
        pricePerception: 'value',
        qualityPosition: 'standard',
        serviceLevel: 'good',
      },
    },
    overallConfidence: 0.0,
    generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

/**
 * Export insights to CSV format
 */
function exportToCSV(insights: WeeklyDigestInsights): Blob {
  const csvData: string[] = [];
  
  // Header
  csvData.push('RepliFast Reviews - Weekly Insights Report');
  csvData.push(`Week: ${insights.week_start} to ${insights.week_end}`);
  csvData.push(`Generated: ${new Date(insights.generated_at).toLocaleString()}`);
  csvData.push('');
  
  // Stats
  csvData.push('WEEKLY STATISTICS');
  csvData.push('Metric,Value');
  csvData.push(`Total Reviews,${insights.stats.totalReviews}`);
  csvData.push(`Average Rating,${insights.stats.averageRating}`);
  csvData.push(`Response Rate,${insights.stats.responseRate}%`);
  csvData.push(`Week over Week Change,${insights.stats.weekOverWeekChange}%`);
  csvData.push(`Unique Customers,${insights.stats.uniqueCustomers}`);
  csvData.push('');
  
  // Positive Themes
  if (insights.positiveThemes.length > 0) {
    csvData.push('POSITIVE THEMES');
    csvData.push('Theme,Priority,Affected Customers,Recommended Action');
    insights.positiveThemes.forEach(theme => {
      csvData.push(`"${theme.theme}",${theme.priority},${theme.affectedCustomerCount},"${theme.recommendedAction}"`);
    });
    csvData.push('');
  }
  
  // Improvement Themes
  if (insights.improvementThemes.length > 0) {
    csvData.push('IMPROVEMENT OPPORTUNITIES');
    csvData.push('Theme,Priority,Affected Customers,Recommended Action');
    insights.improvementThemes.forEach(theme => {
      csvData.push(`"${theme.theme}",${theme.priority},${theme.affectedCustomerCount},"${theme.recommendedAction}"`);
    });
    csvData.push('');
  }
  
  // Highlights
  if (insights.highlights.length > 0) {
    csvData.push('REVIEW HIGHLIGHTS');
    csvData.push('Customer,Rating,Type,Review Text,Business Value');
    insights.highlights.forEach(highlight => {
      csvData.push(`"${highlight.customer_name}",${highlight.rating},${highlight.type},"${highlight.review_text}","${highlight.businessValue}"`);
    });
  }
  
  const csvContent = csvData.join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export insights to JSON format
 */
function exportToJSON(insights: WeeklyDigestInsights): Blob {
  const jsonContent = JSON.stringify(insights, null, 2);
  return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}