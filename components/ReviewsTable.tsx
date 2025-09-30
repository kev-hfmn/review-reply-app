import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit3,
  Send,
  SkipForward,
  Calendar,
  Loader2,
  RefreshCw,
  Wand2,
  Trash2,
  Star,
  MessageSquare,
  Eye,
  EyeIcon,
  EyeOff,
  MessageSquareText
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { UserAvatar } from '@/components/UserAvatar';
import type { ReviewTableProps } from '@/types/reviews';
import type { Review } from '@/types/dashboard';
import { motion } from 'framer-motion';

export default function ReviewsTable({
  reviews,
  isLoading,
  selection,
  onSelectionChange,
  onReviewClick,
  onInlineEdit,
  onQuickAction,
  onGenerateReply,
  onUpdateReply,
  isSubscriber = false,
  onUpgradeRequired
}: ReviewTableProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [generatingReviewId, setGeneratingReviewId] = useState<string | null>(null);
  const [postingReviewId, setPostingReviewId] = useState<string | null>(null);
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState<string | null>(null);

  // Generate star display
  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating
            ? 'text-yellow-500 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  }, []);


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

  // Handle update posted reply with loading state
  const handleUpdateReply = useCallback(async (reviewId: string, newReplyText: string) => {
    if (!onUpdateReply) return;

    setUpdatingReviewId(reviewId);
    try {
      await onUpdateReply(reviewId, newReplyText);
      setEditingReviewId(null); // Close editing mode on success
    } finally {
      setUpdatingReviewId(null);
    }
  }, [onUpdateReply]);

  // Handle inline editing
  const startEditing = useCallback((review: Review) => {
    setEditingReviewId(review.id);
    // For posted reviews, use final_reply; for others use ai_reply
    setEditingText(review.status === 'posted' ? (review.final_reply || '') : (review.ai_reply || ''));
  }, []);

  const saveEdit = useCallback((review: Review) => {
    if (editingReviewId) {
      if (review.status === 'posted') {
        // For posted reviews, use the update handler
        handleUpdateReply(editingReviewId, editingText);
      } else {
        // For non-posted reviews, use the inline edit handler
        onInlineEdit(editingReviewId, editingText);
        setEditingReviewId(null);
        setEditingText('');
      }
    }
  }, [editingReviewId, editingText, onInlineEdit, handleUpdateReply]);

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
          <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
    <div className="space-y-6">

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-card rounded-2xl shadow-lg shadow-slate-200/70 border border-border/80 transition-all duration-200 hover:shadow-sm cursor-pointer ${
              selection.selectedIds.has(review.id)
                ? 'border-primary/70 shadow-lg bg-primary-opacity-5'
                : 'border-border/80 hover:border-primary/30'
            }`}
            onClick={() => onReviewClick(review)}
          >
            <div className="p-6 relative">
              {/* Selection Checkbox - Top Right */}
              <div className="absolute top-4 right-4">
                <Checkbox
                  checked={selection.selectedIds.has(review.id)}
                  onCheckedChange={() => handleSelectReview(review.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
              </div>

              {/* Main Content - Full Width */}
              <div className="">
                {/* Rating Stars */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-light tracking-widest text-muted-foreground">
                    {review.rating}/5
                  </span>
                </div>

                {/* Customer & Date */}
                <div className="flex items-center space-x-3 text-sm mb-3">
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
                <div className="mb-5">
                  <p className="text-foreground/90 text-[0.9rem] leading-relaxed">
                    &ldquo;{review.truncatedReviewText}&rdquo;
                  </p>
                </div>

                {/* Reply Section - Smooth */}

                <div className=" mb-0">
                  {(review.ai_reply || review.final_reply) && (
                    <>
                  <div className="flex flex-col items-left justify-between mb-3 border border-primary/30 pl-4 pr-4 py-4 bg-background/30 shadow-sm rounded-r-xl rounded-bl-xl ">
                    <div className="flex justify-between items-center space-x-2">
                      <div className="flex items-center space-x-2">
                      {/* <UserAvatar size="sm" /> */}
                      <span className="text-sm text-foreground/70 font-medium">
                        Your Reply
                      </span>
                      {/* Status Badge */}
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
                    <div className="flex items-center text-xs text-muted-foreground">
                  </div>
                    </div>


                  {editingReviewId === review.id ? (
                    <div className="pt-3">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="resize-y text-md"
                        rows={3}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className="text-foreground/90 text-[0.9rem] leading-relaxed pt-3">
                      {review.status === 'posted'
                        ? (review.final_reply || 'No reply posted yet')
                        : (review.ai_reply || 'No reply generated yet')
                      }
                    </p>
                  )}
                </div>
                </>
                  )}

                {/* Action Buttons - Full width at bottom of card */}
                <div className="flex items-center justify-between pt-4">
                  {editingReviewId === review.id ? (
                    /* Edit Mode Buttons */
                    <>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-full w-10 h-10 p-0"
                        title="Cancel editing"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEdit(review);
                        }}
                        size="sm"
                        className="rounded-full px-4"
                        disabled={updatingReviewId === review.id}
                      >
                        {updatingReviewId === review.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {review.status === 'posted' ? 'Updating...' : 'Saving...'}
                          </>
                        ) : (
                          review.status === 'posted' ? 'Repost' : 'Save Changes'
                        )}
                      </Button>
                    </>
                  ) : (
                    /* Normal Mode Buttons */
                    <>
                      <div className="flex items-center space-x-2">
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
                      variant={isSubscriber ? "outlinePrimary" : "outline"}
                      title={isSubscriber ? "Generate AI reply" : "Generating replies requires subscription - click to learn more"}
                      disabled={generatingReviewId === review.id}
                      className={`rounded-full min-w-10 h-10 bg-primary/5 hover:bg-primary/90 p-0 ${isSubscriber ? "" : "text-gray-500"}`}
                    >
                      {generatingReviewId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="flex items-center space-x-2 px-3">
                        <Wand2 className="h-4 w-4" /><span>Generate</span>
                        </div>
                      )}
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
                      variant="outline"
                      title={isSubscriber ? "Regenerate AI reply" : "Regenerating replies requires subscription - click to learn more"}
                      disabled={generatingReviewId === review.id}
                      className={`rounded-full w-10 h-10 p-0  ${isSubscriber ? "" : "text-gray-500"}`}
                    >
                      {generatingReviewId === review.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}

                    </Button>
                  )}


                  {/* Approve button hidden for cleaner UI - functionality preserved via drawer */}
                  {/* {review.ai_reply && review.status === 'pending' && (
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
                  )} */}

                  {/* Edit button - show when AI reply exists */}
                  {review.ai_reply && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(review);
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-full w-10 h-10 p-0"
                      disabled={editingReviewId === review.id}
                      title="Edit reply"
                    >
                      <Edit3 className="h-4 w-4" />
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

                      variant={isSubscriber ? "outlinePrimary" : "outline"}
                      title={isSubscriber ? "Post reply" : "Posting requires subscription - click to learn more"}
                      className={`rounded-full text-sm px-3 h-10 ${isSubscriber ? "" : "text-gray-500"}`}
                      disabled={postingReviewId === review.id}
                    >
                      {postingReviewId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                       <div className="flex items-center space-x-2">
                       <Send className="h-4 w-4" />
                       <span>Post</span>
                       </div>
                      )}
                    </Button>
                  )}

                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    {/* Skip button - ghost style */}
                    {review.status !== 'posted' && review.status !== 'skipped' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAction(review.id, 'skip');
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground rounded-full"
                        title="Skip"
                      >
                        <EyeOff className="h-4 w-4" />

                      </Button>
                    )}

                    {/* Delete button - only for posted reviews */}
                    {review.status === 'posted' && review.final_reply && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSubscriber) {
                            setDeleteConfirmReviewId(review.id);
                          } else {
                            onUpgradeRequired?.();
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className={` hover:text-red-600 hover:bg-red-600/20 hover:border-red-600/50 rounded-full w-10 h-10 p-0 ${isSubscriber ? "" : "opacity-50"}`}
                        title={isSubscriber ? "Delete reply from Google Business Profile" : "Deleting replies requires subscription - click to learn more"}
                        disabled={updatingReviewId === review.id}
                      >
                        {updatingReviewId === review.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                      </div>


                    </>
                  )}
                </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmReviewId !== null} onOpenChange={(open) => !open && setDeleteConfirmReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reply? This action will permanently remove the reply from Google Business Profile and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmReviewId) {
                  // TODO: Implement delete functionality with proper type support
                  // onQuickAction(deleteConfirmReviewId, 'delete');
                  setDeleteConfirmReviewId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Reply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
