import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { generateReply, getBusinessSettings, getBusinessInfo } from '@/lib/services/aiReplyService';
import type {
  ReviewFilters,
  ReviewTableItem,
  ReviewActions,
  BulkActions,
  PaginationData,
  ToastNotification
} from '@/types/reviews';
import type { Review, Business } from '@/types/dashboard';
import type { SyncStatus } from '@/components/ReviewFetchControls';

const DEFAULT_FILTERS: ReviewFilters = {
  search: '',
  rating: null,
  status: 'all',
  dateRange: { from: null, to: null },
  businessId: 'all'
};

const PAGE_SIZE = 25;

export function useReviewsData() {
  const { user, selectedBusinessId, isLoading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewTableItem[]>([]);
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug logging
  console.log('useReviewsData loading states:', { isLoading, authLoading, user: !!user, selectedBusinessId });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    syncType: null,
    isBackfillComplete: false,
    lastSyncTime: null,
    totalReviews: 0,
    isFirstTime: true
  });

  // Helper function to show toast notifications
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      id,
      duration: 4000,
      ...toast
    };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  }, []);

  // Transform review data for table display
  const transformReviewForTable = useCallback((review: Review): ReviewTableItem => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    };

    const truncateText = (text: string, maxLength: number = 500) => {
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    const getStatusDisplay = (status: Review['status']) => {
      const statusMap = {
        pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800' },
        approved: { label: 'Approved', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800' },
        posted: { label: 'Posted', color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800' },
        needs_edit: { label: 'Needs Edit', color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800' },
        skipped: { label: 'Skipped', color: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800' }
      };
      return statusMap[status];
    };

    const statusInfo = getStatusDisplay(review.status);

    return {
      ...review,
      customerDisplayName: review.customer_name,
      truncatedReviewText: truncateText(review.review_text),
      formattedReviewDate: formatDate(review.review_date),
      statusColor: statusInfo.color,
      statusLabel: statusInfo.label
    };
  }, []);

  // Fetch businesses with sync status
  const fetchBusinesses = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBusinesses(data || []);

      // Update sync status based on current business
      const currentBusiness = data?.find(b =>
        filters.businessId === 'all' ? true : b.id === filters.businessId
      ) || data?.[0];

      if (currentBusiness) {
        setSyncStatus({
          syncType: currentBusiness.initial_backfill_complete ? 'incremental' : 'initial_backfill',
          isBackfillComplete: currentBusiness.initial_backfill_complete || false,
          lastSyncTime: currentBusiness.last_review_sync,
          totalReviews: reviews.length, // Will be updated when reviews are fetched
          isFirstTime: !currentBusiness.last_review_sync
        });
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses');
    }
  }, [user?.id, filters.businessId, reviews.length]);

  // Fetch reviews with sync status update
  const fetchReviews = useCallback(async () => {
    if (!user?.id) return;

    // Don't start fetching if auth is still loading
    if (authLoading) return;

    try {
      setError(null);
      setIsLoading(true);

      // Handle case where user has no businesses connected or no business selected
      if (businesses.length === 0 || !selectedBusinessId) {
        setReviews([]);
        setFilteredReviews([]);
        setPagination(prev => ({
          ...prev,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }));
        console.log('fetchReviews: No business selected, setting isLoading to false');
        setIsLoading(false);
        return;
      }

      // Use selectedBusinessId instead of filters.businessId for business filtering
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('business_id', selectedBusinessId)
        .order('review_date', { ascending: false });

      // Apply rating filter
      if (filters.rating !== null) {
        query = query.eq('rating', filters.rating);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply date range filter
      if (filters.dateRange.from) {
        query = query.gte('review_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('review_date', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews(data || []);

      // Update sync status with actual review count
      setSyncStatus(prev => ({
        ...prev,
        totalReviews: data?.length || 0
      }));

      let processedReviews = data || [];

      // Apply text search filter (client-side for simplicity)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        processedReviews = processedReviews.filter(
          (review) =>
            review.customer_name.toLowerCase().includes(searchTerm) ||
            review.review_text.toLowerCase().includes(searchTerm)
        );
      }

      setReviews(processedReviews);

      // Transform for table display
      const tableReviews = processedReviews.map(transformReviewForTable);

      // Apply pagination
      const totalItems = tableReviews.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      const startIndex = (pagination.currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedReviews = tableReviews.slice(startIndex, endIndex);

      setFilteredReviews(paginatedReviews);
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages,
        hasNextPage: pagination.currentPage < totalPages,
        hasPrevPage: pagination.currentPage > 1
      }));

    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      console.log('fetchReviews: Setting isLoading to false');
      setIsLoading(false);
    }
  }, [user?.id, businesses, selectedBusinessId, filters, pagination.currentPage, transformReviewForTable, authLoading]);

  // Fetch reviews from Google Business Profile
  const fetchReviewsFromGoogle = useCallback(async (options: { timePeriod: string; reviewCount: number }) => {
    if (!user?.id || businesses.length === 0 || !selectedBusinessId) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No business connected. Please connect your Google Business Profile first.'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/reviews/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          userId: user.id,
          options
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync reviews');
      }

      // Update sync status based on result
      setSyncStatus(prev => ({
        ...prev,
        syncType: result.syncType || 'incremental',
        isBackfillComplete: result.backfillComplete || prev.isBackfillComplete,
        lastSyncTime: result.lastSyncTime,
        isFirstTime: false
      }));

      // Show success toast with appropriate message
      const isInitialBackfill = result.syncType === 'initial_backfill';
      const title = isInitialBackfill ? 'Initial Import Complete' : 'Sync Complete';

      let message: string;
      if (result.newReviews === 0) {
        message = 'No new reviews found. Your reviews are up to date!';
      } else if (result.newReviews === 1) {
        message = '1 new review imported.';
      } else {
        message = `${result.newReviews} new reviews imported.`;
      }

      // Add processing info ONLY for initial backfill or when there are new reviews AND many duplicates
      if (isInitialBackfill || (result.newReviews > 0 && result.totalFetched > result.newReviews + 10)) {
        message += ` ${result.totalFetched} total processed.`;
      }

      showToast({
        type: 'success',
        title,
        message
      });

      // Refresh data
      await Promise.all([fetchBusinesses(), fetchReviews()]);

    } catch (err) {
      console.error('Error syncing reviews:', err);
      showToast({
        type: 'error',
        title: 'Sync Failed',
        message: err instanceof Error ? err.message : 'Failed to sync reviews from Google Business Profile'
      });
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, businesses, selectedBusinessId, showToast, fetchBusinesses, fetchReviews]);

  // Initial data fetch
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Fetch reviews when dependencies change
  useEffect(() => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      console.log('Skipping reviews fetch - auth still loading');
      return;
    }

    console.log('Starting reviews fetch...');
    fetchReviews();
  }, [fetchReviews, authLoading]);

  // Helper function to update a review in local state
  const updateReviewInState = useCallback((reviewId: string, updates: Partial<Review>) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? { ...review, ...updates, updated_at: new Date().toISOString() }
        : review
    ));

    // Also update the filtered/transformed reviews for immediate UI update
    setFilteredReviews(prev => prev.map(review =>
      review.id === reviewId
        ? transformReviewForTable({ ...review, ...updates, updated_at: new Date().toISOString() })
        : review
    ));
  }, [transformReviewForTable]);

  // Review actions
  const reviewActions: ReviewActions = useMemo(() => ({
    approve: async (reviewId: string) => {
      try {
        setIsUpdating(true);
        const { error } = await supabase
          .from('reviews')
          .update({
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, { status: 'approved' });

        // Add activity
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          await supabase
            .from('activities')
            .insert({
              business_id: review.business_id,
              type: 'reply_approved',
              description: `Reply approved for review from ${review.customer_name}`,
              metadata: { review_id: reviewId, rating: review.rating }
            });
        }

        showToast({
          type: 'success',
          title: 'Review approved',
          message: 'The reply has been approved and is ready to post.'
        });
      } catch (err) {
        console.error('Failed to approve review:', err);
        showToast({
          type: 'error',
          title: 'Failed to approve review',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    post: async (reviewId: string) => {
      try {
        setIsUpdating(true);

        // Get the review to find the reply text - EXACT same pattern as other operations
        const review = reviews.find(r => r.id === reviewId);
        if (!review) {
          throw new Error('Review not found');
        }

        // Use final_reply if available, otherwise use ai_reply - EXACT same pattern as existing code
        const replyText = review.final_reply || review.ai_reply;
        if (!replyText) {
          throw new Error('No reply text found. Please generate or edit a reply first.');
        }

        // Call the Google Business Profile API - EXACT same pattern as fetchReviewsFromGoogle
        const response = await fetch('/api/reviews/post-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reviewId,
            userId: user?.id,
            replyText
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || result.details || 'Failed to post reply');
        }

        // Update local state only after successful Google posting - EXACT same pattern as other operations
        const postedAt = result.postedAt || new Date().toISOString();
        updateReviewInState(reviewId, {
          status: 'posted',
          posted_at: postedAt,
          final_reply: replyText
        });

        // Show success notification - clear and specific
        showToast({
          type: 'success',
          title: 'Reply posted to Google!',
          message: 'Your reply has been successfully posted to Google Business Profile.'
        });

      } catch (err) {
        console.error('Failed to post reply to Google:', err);
        showToast({
          type: 'error',
          title: 'Failed to post reply',
          message: err instanceof Error ? err.message : 'Please check your Google Business Profile connection and try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    skip: async (reviewId: string) => {
      try {
        setIsUpdating(true);
        const { error } = await supabase
          .from('reviews')
          .update({
            status: 'skipped',
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, { status: 'skipped' });

        showToast({
          type: 'info',
          title: 'Review skipped',
          message: 'The review has been marked as skipped.'
        });
      } catch (err) {
        console.error('Failed to skip review:', err);
        showToast({
          type: 'error',
          title: 'Failed to skip review',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    updateReply: async (reviewId: string, reply: string) => {
      try {
        setIsUpdating(true);
        const { error } = await supabase
          .from('reviews')
          .update({
            ai_reply: reply,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, { ai_reply: reply });

        showToast({
          type: 'success',
          title: 'Reply updated',
          message: 'The AI reply has been updated.'
        });
      } catch (err) {
        console.error('Failed to update reply:', err);
        showToast({
          type: 'error',
          title: 'Failed to update reply',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    regenerateReply: async (reviewId: string, tone?: string) => {
      try {
        setIsUpdating(true);

        // Find the review
        const review = reviews.find(r => r.id === reviewId);
        if (!review) throw new Error('Review not found');

        // Get the current user's business settings directly
        if (!user) throw new Error('User not authenticated');

        // Get user's business
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (businessError) throw businessError;
        if (!businesses || businesses.length === 0) throw new Error('No business found for user');

        const business = businesses[0];

        // Get business settings
        const settings = await getBusinessSettings(business.id);
        const businessInfo = await getBusinessInfo(business.id);

        if (!settings || !businessInfo) {
          throw new Error('Could not retrieve business settings');
        }

        // Use brand voice settings from business configuration
        // Only override preset if explicitly provided (for regeneration with different tone)
        const brandVoice = {
          ...settings,
          ...(tone && { preset: tone as 'friendly' | 'professional' | 'playful' | 'custom' })
        };

        // Generate AI reply
        const result = await generateReply(
          {
            id: review.id,
            rating: review.rating,
            text: review.review_text,
            customerName: review.customer_name
          },
          brandVoice,
          businessInfo,
          user.id
        );

        // Update in Supabase
        const { error } = await supabase
          .from('reviews')
          .update({
            ai_reply: result.reply,
            reply_tone: brandVoice.preset,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, { ai_reply: result.reply, reply_tone: brandVoice.preset });

        // Show success message (with warning if fallback was used)
        showToast({
          type: result.error ? 'warning' : 'success',
          title: result.error ? 'Reply generated with fallback' : 'Reply regenerated',
          message: result.error ?
            `AI service unavailable, used template reply with ${brandVoice.preset} tone.` :
            `A new ${brandVoice.preset} AI reply has been generated.`
        });
      } catch (err) {
        console.error('Failed to regenerate reply:', err);
        showToast({
          type: 'error',
          title: 'Failed to regenerate reply',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    updateStatus: async (reviewId: string, status: Review['status']) => {
      try {
        setIsUpdating(true);
        const updates: Partial<Review> = {
          status,
          updated_at: new Date().toISOString()
        };

        if (status === 'posted') {
          updates.posted_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('reviews')
          .update(updates)
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, updates);

        showToast({
          type: 'success',
          title: 'Status updated',
          message: `Review status changed to ${status}.`
        });
      } catch (err) {
        console.error('Failed to update status:', err);
        showToast({
          type: 'error',
          title: 'Failed to update status',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    }
  }), [reviews, showToast, updateReviewInState, user]);

  // Helper function to update multiple reviews in local state
  const updateMultipleReviewsInState = useCallback((reviewIds: string[], updates: Partial<Review>) => {
    setReviews(prev => prev.map(review =>
      reviewIds.includes(review.id)
        ? { ...review, ...updates, updated_at: new Date().toISOString() }
        : review
    ));

    // Also update the filtered/transformed reviews for immediate UI update
    setFilteredReviews(prev => prev.map(review =>
      reviewIds.includes(review.id)
        ? transformReviewForTable({ ...review, ...updates, updated_at: new Date().toISOString() })
        : review
    ));
  }, [transformReviewForTable]);

  // Bulk actions
  const bulkActions: BulkActions = useMemo(() => ({
    generateReplies: async (reviewIds: string[]) => {
      try {
        setIsUpdating(true);
        
        // Filter to only reviews without existing replies
        const reviewsToGenerate = reviews.filter(r => 
          reviewIds.includes(r.id) && 
          (!r.ai_reply || r.ai_reply.trim() === '')
        );
        
        if (reviewsToGenerate.length === 0) {
          showToast({
            type: 'info',
            title: 'No reviews to generate',
            message: 'Selected reviews already have AI replies'
          });
          return;
        }

        // Show progress toast
        showToast({
          type: 'info',
          title: 'Generating AI Replies',
          message: `Processing ${reviewsToGenerate.length} reviews...`,
          duration: 15000 // 15 seconds for longer operations
        });

        // Convert to format expected by API
        const reviewsForAPI = reviewsToGenerate.map(review => ({
          id: review.id,
          rating: review.rating,
          text: review.review_text,
          customerName: review.customer_name
        }));

        // Call the bulk generation API
        const response = await fetch('/api/ai/generate-bulk-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews: reviewsForAPI,
            businessId: reviewsToGenerate[0].business_id,
            userId: user?.id,
            updateDatabase: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.code === 'SUBSCRIPTION_REQUIRED') {
            showToast({
              type: 'error',
              title: 'Subscription Required',
              message: errorData.message || 'Batch AI reply generation requires an active subscription.'
            });
            return;
          }
          throw new Error(errorData.error || 'Failed to generate replies');
        }

        const result = await response.json();
        
        // Update local state with generated replies
        if (result.results && result.results.length > 0) {
          const updatedReviews = reviews.map(review => {
            const generated = result.results.find((r: { reviewId: string; success: boolean; reply?: string }) => r.reviewId === review.id);
            if (generated && generated.success && generated.reply) {
              return {
                ...review,
                ai_reply: generated.reply,
                final_reply: generated.reply,
                automated_reply: true,
                automation_failed: false,
                automation_error: null,
                updated_at: new Date().toISOString()
              };
            }
            return review;
          });
          
          setReviews(updatedReviews);
          
          // Also update filtered reviews for immediate UI update
          setFilteredReviews(prev => prev.map(review => {
            const updated = updatedReviews.find(r => r.id === review.id);
            return updated ? transformReviewForTable(updated) : review;
          }));
        }

        // Show results
        const successCount = result.successCount || 0;
        const failureCount = result.failureCount || 0;
        
        if (successCount > 0 && failureCount === 0) {
          showToast({
            type: 'success',
            title: 'AI Replies Generated',
            message: `Successfully generated ${successCount} AI replies`
          });
        } else if (successCount > 0 && failureCount > 0) {
          showToast({
            type: 'warning',
            title: 'Partial Success',
            message: `Generated ${successCount} replies, ${failureCount} failed`
          });
        } else {
          showToast({
            type: 'error',
            title: 'Generation Failed',
            message: 'Failed to generate AI replies. Please try again.'
          });
        }
        
        // Add activity log
        if (reviewsToGenerate[0]) {
          await supabase
            .from('activities')
            .insert({
              business_id: reviewsToGenerate[0].business_id,
              type: 'ai_reply_generated',
              description: `Bulk AI reply generation: ${successCount}/${reviewsToGenerate.length} successful`,
              metadata: { 
                review_count: reviewsToGenerate.length,
                success_count: successCount,
                failure_count: failureCount,
                source: 'bulk_ui'
              }
            });
        }
        
      } catch (error) {
        console.error('Bulk generate replies error:', error);
        showToast({
          type: 'error',
          title: 'Generation Error',
          message: error instanceof Error ? error.message : 'Failed to generate replies. Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    approve: async (reviewIds: string[]) => {
      try {
        setIsUpdating(true);
        const { error } = await supabase
          .from('reviews')
          .update({
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .in('id', reviewIds);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateMultipleReviewsInState(reviewIds, { status: 'approved' });

        showToast({
          type: 'success',
          title: 'Reviews approved',
          message: `${reviewIds.length} review${reviewIds.length > 1 ? 's' : ''} approved successfully.`
        });
      } catch (err) {
        console.error('Failed to approve reviews:', err);
        showToast({
          type: 'error',
          title: 'Failed to approve reviews',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    post: async (reviewIds: string[]) => {
      try {
        setIsUpdating(true);
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process each review individually - EXACT same pattern as single post
        for (const reviewId of reviewIds) {
          try {
            // Get the review to find the reply text - EXACT same pattern as single post
            const review = reviews.find(r => r.id === reviewId);
            if (!review) {
              errors.push(`Review ${reviewId} not found`);
              errorCount++;
              continue;
            }

            // Use final_reply if available, otherwise use ai_reply - EXACT same pattern as single post
            const replyText = review.final_reply || review.ai_reply;
            if (!replyText) {
              errors.push(`No reply text found for ${review.customer_name}'s review`);
              errorCount++;
              continue;
            }

            // Call the Google Business Profile API - EXACT same pattern as single post
            const response = await fetch('/api/reviews/post-reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reviewId,
                userId: user?.id,
                replyText
              }),
            });

            const result = await response.json();

            if (!response.ok) {
              errors.push(`${review.customer_name}: ${result.error || result.details || 'Failed to post'}`);
              errorCount++;
              continue;
            }

            // Update local state only after successful Google posting - EXACT same pattern as single post
            const postedAt = result.postedAt || new Date().toISOString();
            updateReviewInState(reviewId, {
              status: 'posted',
              posted_at: postedAt,
              final_reply: replyText
            });

            successCount++;

          } catch (reviewError) {
            const review = reviews.find(r => r.id === reviewId);
            const customerName = review?.customer_name || 'Unknown';
            errors.push(`${customerName}: ${reviewError instanceof Error ? reviewError.message : 'Unknown error'}`);
            errorCount++;
          }
        }

        // Show appropriate success/error messages - EXACT same pattern as other bulk operations
        if (successCount > 0 && errorCount === 0) {
          showToast({
            type: 'success',
            title: 'All replies posted to Google!',
            message: `${successCount} ${successCount === 1 ? 'reply' : 'replies'} successfully posted to Google Business Profile.`
          });
        } else if (successCount > 0 && errorCount > 0) {
          showToast({
            type: 'warning',
            title: 'Partial success',
            message: `${successCount} replies posted successfully, ${errorCount} failed. Check console for details.`
          });
          console.error('Bulk post errors:', errors);
        } else {
          showToast({
            type: 'error',
            title: 'Failed to post replies',
            message: `All ${errorCount} replies failed to post. ${errors[0] || 'Please check your Google Business Profile connection.'}`
          });
          console.error('Bulk post errors:', errors);
        }

      } catch (err) {
        console.error('Failed to bulk post replies:', err);
        showToast({
          type: 'error',
          title: 'Bulk post failed',
          message: err instanceof Error ? err.message : 'Please check your Google Business Profile connection and try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    },

    skip: async (reviewIds: string[]) => {
      try {
        setIsUpdating(true);
        const { error } = await supabase
          .from('reviews')
          .update({
            status: 'skipped',
            updated_at: new Date().toISOString()
          })
          .in('id', reviewIds);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateMultipleReviewsInState(reviewIds, { status: 'skipped' });

        showToast({
          type: 'info',
          title: 'Reviews skipped',
          message: `${reviewIds.length} review${reviewIds.length > 1 ? 's' : ''} skipped successfully.`
        });
      } catch (err) {
        console.error('Failed to skip reviews:', err);
        showToast({
          type: 'error',
          title: 'Failed to skip reviews',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    }
  }), [reviews, showToast, updateMultipleReviewsInState, transformReviewForTable, updateReviewInState, user?.id]);

  // Filter functions
  const updateFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const refetch = useCallback(() => {
    return fetchReviews();
  }, [fetchReviews]);

  return {
    // Data
    businesses,
    reviews: filteredReviews,
    allReviews: reviews,

    // State
    filters,
    pagination,
    isLoading,
    isUpdating,
    error,
    toasts,
    syncStatus,

    // Actions
    reviewActions,
    bulkActions,

    // Filters & Pagination
    updateFilters,
    resetFilters,
    goToPage,

    // Utils
    refetch,
    removeToast,
    showToast,
    fetchReviewsFromGoogle
  };
}
