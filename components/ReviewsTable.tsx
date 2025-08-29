import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Check,
  Send,
  SkipForward,
  Edit3,
  Calendar,
  Loader2,
  RefreshCw,
  Wand2
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { UserAvatar } from '@/components/UserAvatar';
import type { ReviewTableProps } from '@/types/reviews';
import type { Review } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function ReviewsTable({
  reviews,
  isLoading,
  selection,
  onSelectionChange,
  onReviewClick,
  onInlineEdit,
  onQuickAction,
  onGenerateReply,
  isSubscriber = false,
  onUpgradeRequired
}: ReviewTableProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [generatingReviewId, setGeneratingReviewId] = useState<string | null>(null);
  const [postingReviewId, setPostingReviewId] = useState<string | null>(null);

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

  // Handle generate reply with loading state
  const handleGenerateReply = useCallback(async (reviewId: string) => {
    setGeneratingReviewId(reviewId);
    try {
      await onGenerateReply(reviewId);
    } finally {
      setGeneratingReviewId(null);
    }
  }, [onGenerateReply]);

  // Handle post reply with loading state
  const handlePostReply = useCallback(async (reviewId: string) => {
    setPostingReviewId(reviewId);
    try {
      await onQuickAction(reviewId, 'post');
    } finally {
      setPostingReviewId(null);
    }
  }, [onQuickAction]);

  if (isLoading) {
    return (
      <div className="bg-background rounded-xl shadow-sm border border-border p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, j) => (
                    <div key={j} className="w-4 h-4 bg-muted rounded-sm"></div>
                  ))}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-muted rounded-full"></div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0 && !isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-12">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No reviews found
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            No reviews match your current filters. Try adjusting your search criteria or check back later for new reviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-foreground/10 rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center">
          <div className="flex items-center">
            <Checkbox
              checked={selection.isAllSelected}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
            <span className="ml-3 text-sm font-normal text-foreground">
              {selection.selectedIds.size > 0
                ? `${selection.selectedIds.size} selected`
                : 'Select all'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-6 transition-colors cursor-pointer ${
              selection.selectedIds.has(review.id)
                ? 'bg-gray-50'
                : 'bg-card hover:bg-card'
            }`}
            onClick={() => onReviewClick(review)}
          >
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <div className="flex-shrink-0 pt-1">
                <Checkbox
                  checked={selection.selectedIds.has(review.id)}
                  onCheckedChange={() => handleSelectReview(review.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
              </div>

              {/* Main Content - Full Width */}
              <div className="flex-1 min-w-0 pr-6">
                {/* Rating Stars */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-light text-muted-foreground">
                    {review.rating}/5
                  </span>
                </div>

                {/* Customer & Date */}
                <div className="flex items-center space-x-2 text-sm mb-3">
                  <Avatar
                    src={review.customer_avatar_url}
                    alt={`${review.customerDisplayName}'s avatar`}
                    size="md"
                  />
                  <span className="font-medium text-foreground text-md self-center">
                    {review.customerDisplayName}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span className="text-muted-foreground">
                    {review.formattedReviewDate}
                  </span>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <p className="text-foreground/90 text-sm leading-relaxed">
                    &ldquo;{review.truncatedReviewText}&rdquo;
                  </p>
                </div>

                {/* AI Reply Section - Enhanced */}
                <div className="bg-muted-foreground/5 border border-muted-foreground/50 rounded-lg p-5 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <UserAvatar size="sm" />
                      <span className="text-sm text-foreground/80 font-medium">
                        Your Reply
                      </span>
                      {/* Status Badge - moved here to clarify it refers to the reply */}
                      <Badge
                        variant={review.status as 'default' | 'secondary' | 'destructive' | 'outline'}
                        className="text-xs"
                      >
                        {review.statusLabel}
                      </Badge>
                      {/* Posted timestamp - show when reply was posted to Google */}
                      {review.status === 'posted' && review.posted_at && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <span>
                            on {new Date(review.posted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(review);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:text-foreground/80 dark:text-foreground/80 dark:hover:text-foreground/80 p-1 h-8 w-8"
                      disabled={editingReviewId === review.id}
                      title="Edit reply"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {editingReviewId === review.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="resize-none text-md"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center justify-end !mt-5 space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          variant="outline"
                          size="sm"
                          className=""
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEdit();
                          }}
                          size="sm"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground/90 text-sm leading-relaxed">
                      {review.ai_reply || 'No reply generated/posted yet'}
                    </p>
                  )}
                </div>

                {/* Action Buttons - Moved below AI reply, full width */}
                <div className="flex items-center justify-end space-x-2 pt-3 mt-4">
                  {/* Show Generate Reply button when no AI reply exists */}
                  {!review.ai_reply && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSubscriber) {
                          handleGenerateReply(review.id);
                        } else {
                          onUpgradeRequired?.();
                        }
                      }}
                      size="sm"
                      variant={isSubscriber ? "secondary" : "outline"}
                      title={isSubscriber ? "Generate AI reply" : "Generating replies requires subscription - click to learn more"}
                      disabled={generatingReviewId === review.id}
                      className={isSubscriber ? "" : "text-gray-500"}
                    >
                      {generatingReviewId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      <span>
                        {generatingReviewId === review.id ? 'Generating...' : isSubscriber ? 'Generate Reply' : 'Generate (Upgrade)'}
                      </span>
                    </Button>
                  )}


                  {/* Show Regenerate button when AI reply exists and status is pending */}
                  {review.ai_reply && review.status === 'pending' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSubscriber) {
                          handleGenerateReply(review.id);
                        } else {
                          onUpgradeRequired?.();
                        }
                      }}
                      size="sm"
                      variant="outlineSecondary"
                      title={isSubscriber ? "Regenerate AI reply" : "Regenerating replies requires subscription - click to learn more"}
                      disabled={generatingReviewId === review.id}
                      className={isSubscriber ? "" : "text-gray-500"}
                    >
                      {generatingReviewId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span>
                        {generatingReviewId === review.id ? 'Regenerating...' : isSubscriber ? 'Regenerate' : 'Regenerate (Upgrade)'}
                      </span>
                    </Button>
                  )}


                  {/* Show Approve button only when AI reply exists and status is pending */}
                  {review.ai_reply && review.status === 'pending' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction(review.id, 'approve');
                      }}
                      size="sm"
                      variant="outlinePrimary"
                      title="Approve reply"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </Button>
                  )}

                  {/* Show Post button only when AI reply exists */}
                  {review.ai_reply && (review.status === 'approved' || review.status === 'pending') && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSubscriber) {
                          handlePostReply(review.id);
                        } else {
                          onUpgradeRequired?.();
                        }
                      }}
                      size="sm"
                      variant={isSubscriber ? "outlineGreen" : "outline"}
                      title={isSubscriber ? "Post reply" : "Posting requires subscription - click to learn more"}
                      className={isSubscriber ? "" : "text-gray-500"}
                      disabled={postingReviewId === review.id}
                    >
                      {postingReviewId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>
                        {postingReviewId === review.id ? "Posting..." : isSubscriber ? "Post" : "Post (Upgrade)"}
                      </span>
                    </Button>
                  )}

                  {/* Skip button - available when not posted or skipped */}
                  {review.status !== 'posted' && review.status !== 'skipped' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction(review.id, 'skip');
                      }}
                      variant="outlineDefault"
                      size="sm"

                      title="Skip"
                    >
                      <SkipForward className="h-4 w-4" />
                      <span>Skip</span>
                    </Button>
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
