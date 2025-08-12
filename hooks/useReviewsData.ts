import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  ReviewFilters, 
  ReviewTableItem, 
  ReviewsPageData,
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

    const truncateText = (text: string, maxLength: number = 100) => {
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

      const { data, error, count } = await query;

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

        await fetchReviews();
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
        const { error } = await supabase
          .from('reviews')
          .update({ 
            status: 'posted',
            posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

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

        await fetchReviews();
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

        showToast({
          type: 'info',
          title: 'Review skipped',
          message: 'The review has been marked as skipped.'
        });

        await fetchReviews();
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

        showToast({
          type: 'success',
          title: 'Reply updated',
          message: 'The AI reply has been updated.'
        });

        await fetchReviews();
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
        
        // For now, we'll simulate AI reply generation with template responses
        // TODO: Replace with actual AI integration
        const review = reviews.find(r => r.id === reviewId);
        if (!review) throw new Error('Review not found');

        const generateMockReply = (rating: number, customerName: string, tone: string) => {
          const toneTemplates = {
            friendly: {
              5: `Thank you so much, ${customerName}! We're thrilled you had such a wonderful experience with us. Your kind words truly make our day! 😊`,
              4: `Thank you for the great review, ${customerName}! We're so glad you enjoyed your experience. We appreciate your feedback and hope to see you again soon!`,
              3: `Hi ${customerName}, thank you for taking the time to share your feedback. We're glad you had a decent experience and would love to make it even better next time!`,
              2: `Hi ${customerName}, thank you for your honest feedback. We're sorry we didn't meet your expectations and would love the opportunity to improve your experience.`,
              1: `${customerName}, we're truly sorry about your experience. This isn't the standard we strive for. Please contact us directly so we can make this right.`
            },
            professional: {
              5: `Dear ${customerName}, we sincerely appreciate your excellent review. Your satisfaction is our top priority, and we look forward to serving you again.`,
              4: `Dear ${customerName}, thank you for your positive feedback. We value your business and appreciate you taking the time to share your experience.`,
              3: `Dear ${customerName}, we appreciate your feedback. We strive for excellence and would welcome the opportunity to exceed your expectations in the future.`,
              2: `Dear ${customerName}, thank you for bringing this to our attention. We take all feedback seriously and are committed to improving our service.`,
              1: `Dear ${customerName}, we apologize for not meeting your expectations. Please contact our management team so we can address your concerns properly.`
            },
            playful: {
              5: `Wow, ${customerName}! You just made our whole team do a happy dance! 🎉 Thanks for the amazing review - you're absolutely wonderful!`,
              4: `Hey ${customerName}! Thanks for the awesome review! We're doing a little celebration dance over here 💃 Hope to see you again soon!`,
              3: `Hi ${customerName}! Thanks for the feedback - we're pretty good, but we know we can be GREAT! Can't wait to wow you next time! ⭐`,
              2: `Hey ${customerName}, oops! Looks like we missed the mark this time. We promise we're usually more awesome than this! Let us make it up to you! 😅`,
              1: `Oh no, ${customerName}! We really dropped the ball here 😔 This is definitely not our usual style - please let us make this right!`
            }
          };

          const templates = toneTemplates[tone as keyof typeof toneTemplates] || toneTemplates.friendly;
          return templates[rating as keyof typeof templates] || templates[3];
        };

        const newReply = generateMockReply(review.rating, review.customer_name, tone);

        const { error } = await supabase
          .from('reviews')
          .update({ 
            ai_reply: newReply,
            reply_tone: tone,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId);

        if (error) throw error;

        showToast({
          type: 'success',
          title: 'Reply regenerated',
          message: `A new ${tone} reply has been generated.`
        });

        await fetchReviews();
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
        const updates: any = { 
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

        showToast({
          type: 'success',
          title: 'Status updated',
          message: `Review status changed to ${status}.`
        });

        await fetchReviews();
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
  }), [reviews, fetchReviews, showToast]);

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

        showToast({
          type: 'success',
          title: 'Reviews approved',
          message: `${reviewIds.length} review${reviewIds.length > 1 ? 's' : ''} approved successfully.`
        });

        await fetchReviews();
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
        const { error } = await supabase
          .from('reviews')
          .update({ 
            status: 'posted',
            posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', reviewIds);

        if (error) throw error;

        showToast({
          type: 'success',
          title: 'Replies posted',
          message: `${reviewIds.length} repl${reviewIds.length > 1 ? 'ies' : 'y'} posted successfully.`
        });

        await fetchReviews();
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

        showToast({
          type: 'info',
          title: 'Reviews skipped',
          message: `${reviewIds.length} review${reviewIds.length > 1 ? 's' : ''} marked as skipped.`
        });

        await fetchReviews();
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
    },

    delete: async (reviewIds: string[]) => {
      try {
        setIsUpdating(true);
        const { error } = await supabase
          .from('reviews')
          .delete()
          .in('id', reviewIds);

        if (error) throw error;

        showToast({
          type: 'success',
          title: 'Reviews deleted',
          message: `${reviewIds.length} review${reviewIds.length > 1 ? 's' : ''} deleted successfully.`
        });

        await fetchReviews();
      } catch (err) {
        console.error('Failed to delete reviews:', err);
        showToast({
          type: 'error',
          title: 'Failed to delete reviews',
          message: err instanceof Error ? err.message : 'Please try again.'
        });
      } finally {
        setIsUpdating(false);
      }
    }
  }), [fetchReviews, showToast]);

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