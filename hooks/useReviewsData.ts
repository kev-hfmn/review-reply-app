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

const DEFAULT_FILTERS: ReviewFilters = {
  search: '',
  rating: null,
  status: 'all',
  dateRange: { from: null, to: null },
  businessId: 'all'
};

const PAGE_SIZE = 25;

export function useReviewsData() {
  const { user } = useAuth();
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

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

    const truncateText = (text: string, maxLength: number = 160) => {
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

  // Fetch businesses
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
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
      setError('Failed to load businesses');
    }
  }, [user?.id]);

  // Fetch reviews with filters
  const fetchReviews = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get business IDs for the user
      const businessIds = businesses.length > 0
        ? businesses.map(b => b.id)
        : (await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
          ).data?.map(b => b.id) || [];

      if (businessIds.length === 0) {
        setReviews([]);
        setFilteredReviews([]);
        setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
        return;
      }

      // Build query
      let query = supabase
        .from('reviews')
        .select('*')
        .in('business_id', businessIds)
        .order('review_date', { ascending: false });

      // Apply business filter
      if (filters.businessId !== 'all') {
        query = query.eq('business_id', filters.businessId);
      }

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

      let processedReviews = data || [];

      // Apply text search filter (client-side for simplicity)
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        processedReviews = processedReviews.filter(review =>
          review.customer_name.toLowerCase().includes(searchTerm) ||
          review.review_text.toLowerCase().includes(searchTerm) ||
          (review.ai_reply && review.ai_reply.toLowerCase().includes(searchTerm)) ||
          (review.final_reply && review.final_reply.toLowerCase().includes(searchTerm))
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
      setIsLoading(false);
    }
  }, [user?.id, businesses, filters, pagination.currentPage, transformReviewForTable]);

  // Initial data fetch
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    if (businesses.length >= 0) { // Allow empty array (no businesses case)
      fetchReviews();
    }
  }, [fetchReviews, businesses]);

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
        const postedAt = new Date().toISOString();
        const { error } = await supabase
          .from('reviews')
          .update({
            status: 'posted',
            posted_at: postedAt,
            updated_at: postedAt
          })
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, { status: 'posted', posted_at: postedAt });

        // Add activity
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          await supabase
            .from('activities')
            .insert({
              business_id: review.business_id,
              type: 'reply_posted',
              description: `Reply posted to ${review.rating}-star review from ${review.customer_name}`,
              metadata: { review_id: reviewId, rating: review.rating }
            });
        }

        showToast({
          type: 'success',
          title: 'Reply posted',
          message: 'The reply has been posted successfully.'
        });
      } catch (err) {
        console.error('Failed to post reply:', err);
        showToast({
          type: 'error',
          title: 'Failed to post reply',
          message: err instanceof Error ? err.message : 'Please try again.'
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

    regenerateReply: async (reviewId: string, tone = 'friendly') => {
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

        // Override tone if specified
        const brandVoice = {
          ...settings,
          preset: tone as 'friendly' | 'professional' | 'playful' | 'custom' || settings.preset
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
          businessInfo
        );

        // Update in Supabase
        const { error } = await supabase
          .from('reviews')
          .update({
            ai_reply: result.reply,
            reply_tone: tone,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateReviewInState(reviewId, { ai_reply: result.reply, reply_tone: tone });

        // Show success message (with warning if fallback was used)
        showToast({
          type: result.error ? 'warning' : 'success',
          title: result.error ? 'Reply generated with fallback' : 'Reply regenerated',
          message: result.error ?
            `AI service unavailable, used template reply with ${tone} tone.` :
            `A new ${tone} AI reply has been generated.`
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
        const postedAt = new Date().toISOString();
        const { error } = await supabase
          .from('reviews')
          .update({
            status: 'posted',
            posted_at: postedAt,
            updated_at: postedAt
          })
          .in('id', reviewIds);

        if (error) throw error;

        // Update local state immediately to preserve scroll position
        updateMultipleReviewsInState(reviewIds, { status: 'posted', posted_at: postedAt });

        showToast({
          type: 'success',
          title: 'Replies posted',
          message: `${reviewIds.length} repl${reviewIds.length > 1 ? 'ies' : 'y'} posted successfully.`
        });
      } catch (err) {
        console.error('Failed to post replies:', err);
        showToast({
          type: 'error',
          title: 'Failed to post replies',
          message: err instanceof Error ? err.message : 'Please try again.'
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
  }), [showToast, updateMultipleReviewsInState]);

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
    showToast
  };
}
