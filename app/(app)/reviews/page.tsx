'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewsData } from '@/hooks/useReviewsData';
import ReviewFilters from '@/components/ReviewFilters';
import ReviewsTable from '@/components/ReviewsTable';
import BulkActionsBar from '@/components/BulkActionsBar';
import ReviewDrawer from '@/components/ReviewDrawer';
import ToastNotifications from '@/components/ToastNotifications';
import type { FetchOptions } from '@/components/ReviewFetchControls';
import type { Review } from '@/types/dashboard';
import type { SelectionState, ReviewDrawerData } from '@/types/reviews';
import { REPLY_TONES } from '@/types/reviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ReviewsPage() {
  const { isSubscriber } = useAuth();
  const {
    businesses,
    reviews,
    allReviews,
    filters,
    pagination,
    isLoading,
    isUpdating,
    error,
    toasts,
    // syncStatus no longer needed after removing ReviewFetchControls
    reviewActions,
    bulkActions,
    updateFilters,
    resetFilters,
    goToPage,
    refetch,
    removeToast,
    showToast,
    fetchReviewsFromGoogle
  } = useReviewsData();

  const [isFetchingReviews, setIsFetchingReviews] = useState(false);

  // Selection state
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    isAllSelected: false,
    isIndeterminate: false
  });

  // Review drawer state
  const [drawerData, setDrawerData] = useState<ReviewDrawerData>({
    review: null,
    isOpen: false,
    isLoading: false,
    availableTones: [...REPLY_TONES]
  });

  // Handle review click (open drawer)
  const handleReviewClick = useCallback((review: Review) => {
    setDrawerData({
      review,
      isOpen: true,
      isLoading: false,
      availableTones: [...REPLY_TONES]
    });
  }, []);

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setDrawerData(prev => ({ ...prev, isOpen: false, review: null }));
  }, []);

  // Handle drawer save
  const handleDrawerSave = useCallback(async (reviewId: string, reply: string, tone: string) => {
    setDrawerData(prev => ({ ...prev, isLoading: true }));
    try {
      await reviewActions.updateReply(reviewId, reply);
      // Update the drawer data with the new reply
      setDrawerData(prev => ({
        ...prev,
        review: prev.review ? { ...prev.review, ai_reply: reply, reply_tone: tone } : null,
        isLoading: false
      }));
    } catch {
      setDrawerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [reviewActions]);

  // Handle drawer actions
  const handleDrawerApprove = useCallback(async (reviewId: string) => {
    setDrawerData(prev => ({ ...prev, isLoading: true }));
    try {
      await reviewActions.approve(reviewId);
      handleDrawerClose();
    } catch {
      setDrawerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [reviewActions, handleDrawerClose]);

  const handleDrawerPost = useCallback(async (reviewId: string) => {
    setDrawerData(prev => ({ ...prev, isLoading: true }));
    try {
      await reviewActions.post(reviewId);
      handleDrawerClose();
    } catch {
      setDrawerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [reviewActions, handleDrawerClose]);

  const handleDrawerRegenerate = useCallback(async (reviewId: string, tone: string) => {
    setDrawerData(prev => ({ ...prev, isLoading: true }));
    try {
      await reviewActions.regenerateReply(reviewId, tone);

      // Add a small delay to ensure state is updated
      setTimeout(() => {
        const updatedReview = allReviews.find(r => r.id === reviewId);

        if (updatedReview) {
          setDrawerData(prev => ({
            ...prev,
            review: { ...updatedReview }, // Force new object reference
            isLoading: false
          }));
        } else {
          setDrawerData(prev => ({ ...prev, isLoading: false }));
        }
      }, 100);
    } catch {
      setDrawerData(prev => ({ ...prev, isLoading: false }));
    }
  }, [reviewActions, allReviews]);

  // Handle inline editing
  const handleInlineEdit = useCallback(async (reviewId: string, reply: string) => {
    try {
      await reviewActions.updateReply(reviewId, reply);
    } catch {
      // Error handling is done in the hook
    }
  }, [reviewActions]);

  // Handle quick actions
  const handleQuickAction = useCallback(async (reviewId: string, action: 'approve' | 'post' | 'skip') => {
    try {
      switch (action) {
        case 'approve':
          await reviewActions.approve(reviewId);
          break;
        case 'post':
          await reviewActions.post(reviewId);
          break;
        case 'skip':
          await reviewActions.skip(reviewId);
          break;
      }
    } catch {
      // Error handling is done in the hook
    }
  }, [reviewActions]);

  // Handle bulk actions
  const handleBulkApprove = useCallback(async () => {
    try {
      await bulkActions.approve(Array.from(selection.selectedIds));
      setSelection({ selectedIds: new Set(), isAllSelected: false, isIndeterminate: false });
    } catch {
      // Error handling is done in the hook
    }
  }, [bulkActions, selection.selectedIds]);

  const handleBulkPost = useCallback(async () => {
    try {
      await bulkActions.post(Array.from(selection.selectedIds));
      setSelection({ selectedIds: new Set(), isAllSelected: false, isIndeterminate: false });
    } catch {
      // Error handling is done in the hook
    }
  }, [bulkActions, selection.selectedIds]);

  const handleBulkSkip = useCallback(async () => {
    try {
      await bulkActions.skip(Array.from(selection.selectedIds));
      setSelection({ selectedIds: new Set(), isAllSelected: false, isIndeterminate: false });
    } catch {
      // Error handling is done in the hook
    }
  }, [bulkActions, selection.selectedIds]);

  const handleClearSelection = useCallback(() => {
    setSelection({ selectedIds: new Set(), isAllSelected: false, isIndeterminate: false });
  }, []);

  // Handle fetching reviews from Google Business Profile
  const handleFetchReviews = useCallback(async (options: FetchOptions) => {
    setIsFetchingReviews(true);
    try {
      await fetchReviewsFromGoogle(options);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsFetchingReviews(false);
    }
  }, [fetchReviewsFromGoogle]);

  // Handle export (placeholder)
  const handleExport = useCallback(() => {
    showToast({
      type: 'info',
      title: 'Export feature coming soon',
      message: 'Export functionality will be available in a future update.'
    });
  }, [showToast]);

  const filteredCount = reviews.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and respond to customer reviews
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isSubscriber ? (
            <Button
              onClick={() => handleFetchReviews({ timePeriod: '30days', reviewCount: 50 })}
              disabled={isFetchingReviews || isUpdating}
              variant="primary"
              className="flex items-center space-x-2 px-3 py-2 "
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingReviews ? 'animate-spin' : ''}`} />
              <span>Fetch New Reviews</span>
            </Button>
          ) : (
            <Button
              onClick={() => showToast({
                type: 'info',
                message: 'Review syncing requires an active subscription. Please upgrade your plan to access this feature.',
                title: 'Subscription Required'
              })}
              variant="outline"
              className="flex items-center space-x-2 px-3 py-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Fetch New Reviews (Upgrade Required)</span>
            </Button>
          )}

{/*           <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button> */}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <p className="text-red-800 dark:text-red-200 font-medium">
            Error loading reviews
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {error}
          </p>
          <button
            onClick={refetch}
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Review Fetch Controls moved to header */}

      {/* Filters */}
      <ReviewFilters
        filters={filters}
        businesses={businesses}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        isLoading={isLoading}
        resultCount={filteredCount}
      />

      {/* Empty State for Basic Users */}
      {!isSubscriber && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Subscription Required
            </h3>
            <p className="text-muted-foreground mb-6">
              To view and manage your reviews, you need to connect your Google Business Profile and upgrade to a premium plan.
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground">
                Premium features include:
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Import and sync all your reviews</p>
                <p>• Generate AI-powered replies</p>
                <p>• Post replies directly to Google</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/settings?tab=integrations'}
                variant="outline"
              >
                Connect Google Business Profile
              </Button>
              <Button
                onClick={() => window.location.href = '/profile'}
                className="bg-primary hover:bg-primary/90"
              >
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Table */}
      {isSubscriber && (
        <ReviewsTable
          reviews={reviews}
          isLoading={isLoading}
          selection={selection}
          onSelectionChange={setSelection}
          onReviewClick={handleReviewClick}
          onInlineEdit={handleInlineEdit}
          onQuickAction={handleQuickAction}
          onGenerateReply={reviewActions.regenerateReply}
          isSubscriber={isSubscriber}
          onUpgradeRequired={() => showToast({
            type: 'info',
            message: 'Posting replies requires an active subscription. Please upgrade your plan to access this feature.',
            title: 'Subscription Required'
          })}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-neutral-dark rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            <span>
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selection={selection}
        onApprove={handleBulkApprove}
        onPost={handleBulkPost}
        onSkip={handleBulkSkip}
        onClearSelection={handleClearSelection}
        isLoading={isUpdating}
        isSubscriber={isSubscriber}
        onUpgradeRequired={() => showToast({
          type: 'info',
          message: 'Posting replies requires an active subscription. Please upgrade your plan to access this feature.',
          title: 'Subscription Required'
        })}
      />

      {/* Review Drawer */}
      <ReviewDrawer
        data={drawerData}
        onClose={handleDrawerClose}
        onSave={handleDrawerSave}
        onApprove={handleDrawerApprove}
        onPost={handleDrawerPost}
        onRegenerate={handleDrawerRegenerate}
        isSubscriber={isSubscriber}
        onUpgradeRequired={() => showToast({
          type: 'info',
          message: 'Generating AI replies requires an active subscription. Please upgrade your plan to access this feature.',
          title: 'Subscription Required'
        })}
      />

      {/* Toast Notifications */}
      <ToastNotifications
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
}
