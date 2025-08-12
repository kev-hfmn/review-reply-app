import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Star,
  MessageSquare,
  Check,
  Send,
  SkipForward,
  Edit3,
  Eye,
  Calendar,
  User,
  ChevronDown
} from 'lucide-react';
import type { ReviewTableProps, SelectionState } from '@/types/reviews';
import type { Review } from '@/types/dashboard';

export default function ReviewsTable({
  reviews,
  isLoading,
  selection,
  onSelectionChange,
  onReviewClick,
  onInlineEdit,
  onQuickAction
}: ReviewTableProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Generate star display
  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  }, []);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (selection.isAllSelected) {
      onSelectionChange({
        selectedIds: new Set(),
        isAllSelected: false,
        isIndeterminate: false
      });
    } else {
      onSelectionChange({
        selectedIds: new Set(reviews.map(r => r.id)),
        isAllSelected: true,
        isIndeterminate: false
      });
    }
  }, [reviews, selection.isAllSelected, onSelectionChange]);

  const handleSelectReview = useCallback((reviewId: string) => {
    const newSelectedIds = new Set(selection.selectedIds);
    
    if (newSelectedIds.has(reviewId)) {
      newSelectedIds.delete(reviewId);
    } else {
      newSelectedIds.add(reviewId);
    }

    const isAllSelected = newSelectedIds.size === reviews.length && reviews.length > 0;
    const isIndeterminate = newSelectedIds.size > 0 && newSelectedIds.size < reviews.length;

    onSelectionChange({
      selectedIds: newSelectedIds,
      isAllSelected,
      isIndeterminate
    });
  }, [reviews.length, selection.selectedIds, onSelectionChange]);

  // Handle inline editing
  const startEditing = useCallback((review: Review) => {
    setEditingReviewId(review.id);
    setEditingText(review.ai_reply || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (editingReviewId) {
      onInlineEdit(editingReviewId, editingText);
      setEditingReviewId(null);
      setEditingText('');
    }
  }, [editingReviewId, editingText, onInlineEdit]);

  const cancelEdit = useCallback(() => {
    setEditingReviewId(null);
    setEditingText('');
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, j) => (
                    <div key={j} className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                  ))}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No reviews found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No reviews match your current filters. Try adjusting your search criteria or check back later for new reviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selection.isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = selection.isIndeterminate;
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              {selection.selectedIds.size > 0 
                ? `${selection.selectedIds.size} selected` 
                : 'Select all'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
              selection.selectedIds.has(review.id) ? 'bg-primary/5' : ''
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={selection.selectedIds.has(review.id)}
                  onChange={() => handleSelectReview(review.id)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              </div>

              {/* Rating Stars */}
              <div className="flex-shrink-0 pt-1">
                <div className="flex space-x-1">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Customer & Date */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {review.customerDisplayName}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">•</span>
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {review.formattedReviewDate}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${review.statusColor}`}>
                    {review.statusLabel}
                  </span>
                </div>

                {/* Review Text */}
                <div className="mb-3">
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    "{review.truncatedReviewText}"
                  </p>
                </div>

                {/* AI Reply Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        AI Reply
                      </span>
                      {review.reply_tone && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {review.reply_tone}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => startEditing(review)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      disabled={editingReviewId === review.id}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {editingReviewId === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                      {review.ai_reply || 'No AI reply generated yet'}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onReviewClick(review)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {review.status === 'pending' && (
                    <button
                      onClick={() => onQuickAction(review.id, 'approve')}
                      className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  
                  {(review.status === 'approved' || review.status === 'pending') && (
                    <button
                      onClick={() => onQuickAction(review.id, 'post')}
                      className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Post reply"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  
                  {review.status !== 'posted' && review.status !== 'skipped' && (
                    <button
                      onClick={() => onQuickAction(review.id, 'skip')}
                      className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
                      title="Skip"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}