import { useState, useEffect } from 'react';
import {
  Star,
  Calendar,
  MessageSquare,
  Wand2,
  Check,
  Send,
  Save,
  Loader2,
  X
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ReviewDrawerProps } from '@/types/reviews';
import { REPLY_TONES } from '@/types/reviews';
import { Button } from './ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ReviewDrawer({
  data,
  allReviews,
  onClose,
  onSave,
  onApprove,
  onPost,
  onRegenerate,
  isSubscriber = false,
  onUpgradeRequired
}: ReviewDrawerProps) {
  const [editedReply, setEditedReply] = useState('');
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Derive current review from allReviews
  const review = data.reviewId ? allReviews.find(r => r.id === data.reviewId) : null;

  // Update local state when review changes
  useEffect(() => {
    if (review) {
      console.log('ReviewDrawer: updating state with ai_reply:', review.ai_reply);
      setEditedReply(review.ai_reply || '');
      setSelectedTone(review.reply_tone || 'friendly');
    }
  }, [review]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const handleRegenerate = async () => {
    if (!review) return;

    // Check subscription before proceeding
    if (!isSubscriber) {
      onUpgradeRequired?.();
      return;
    }

    setIsRegenerating(true);
    try {
      console.log('Before regenerate - current ai_reply:', review.ai_reply);
      console.log('Before regenerate - editedReply state:', editedReply);

      await onRegenerate(review.id, selectedTone);
      // No need for setTimeout - the useEffect will handle the update when allReviews changes

    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!review) return;

    setIsSaving(true);
    try {
      await onSave(review.id, editedReply, selectedTone);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!review) return;

    try {
      await onApprove(review.id);
    } catch (error) {
      console.error('Error approving review:', error);
      // Error handling is done in the parent component
    }
  };

  const handlePost = async () => {
    if (!review) return;

    // Check subscription before proceeding
    if (!isSubscriber) {
      onUpgradeRequired?.();
      return;
    }

    setIsPosting(true);
    try {
      await onPost(review.id);
    } catch (error) {
      console.error('Error posting review:', error);
      // Error handling is done in the parent component
    } finally {
      setIsPosting(false);
    }
  };

  if (!review) return null;

  const hasChanges = editedReply !== (review.ai_reply || '') || selectedTone !== (review.reply_tone || 'friendly');

  return (
    <Dialog open={data.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-background text-foreground !p-0">


        <div className="space-y-8">
          {/* Review Card - Matching ReviewsTable styling */}
          <div className="bg-card rounded-2xl  p-6">
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
            <div className="flex items-center  space-x-3 text-sm mb-4">
              <Avatar
                src={review.customer_avatar_url}
                alt={`${review.customer_name}'s avatar`}
                size="md"
              />
              <span className="font-medium text-foreground text-lg">
                {review.customer_name}
              </span>
              <span className="text-muted-foreground">•</span>
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-muted-foreground">
                {new Date(review.review_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>


            {/* Status Badge */}
            <div className="flex items-center space-x-3">
              <Badge
                variant={review.status as 'default' | 'secondary' | 'destructive' | 'outline'}
                className="text-sm "
              >
                {review.status === 'needs_edit' ? 'Needs Edit' :
                 review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </Badge>
              {/* Posted timestamp - show when reply was posted to Google */}
              {review.status === 'posted' && review.posted_at && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <span>
                    Posted on {new Date(review.posted_at).toLocaleDateString('en-US', {
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
            </div>
            {/* Review Text */}
            <div className="mb-6">
              <p className="text-foreground/90 text-base leading-relaxed">
                &ldquo;{review.review_text}&rdquo;
              </p>
            </div>

            {/* Reply Section - Matching card styling */}
            {(review.ai_reply || review.final_reply || editedReply) && (
              <div className="border border-primary/20 pl-6 pr-6 py-6 bg-background/50 shadow-sm rounded-r-xl rounded-bl-xl">
                <div className="flex justify-between items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-md text-foreground/70 font-medium">
                      Your Reply
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Textarea
                    value={editedReply}
                    onChange={(e) => setEditedReply(e.target.value)}
                    className="resize-y !text-base leading-relaxed min-h-[150px] border-primary/20 focus:border-primary/40"
                    placeholder="Your reply will appear here..."
                    disabled={data.isLoading || isRegenerating}
                  />
                </div>
              </div>
            )}

            {/* Empty state when no reply */}
            {!review.ai_reply && !review.final_reply && !editedReply && (
              <div className="border border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No reply generated yet. Click "Generate Reply" to create one.
                </p>
              </div>
            )}

                      {/* Tone Selection */}
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-foreground">
                Reply Tone
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {REPLY_TONES.map(tone => (
                <Button
                  key={tone.id}
                  size="sm"
                  variant={selectedTone === tone.id ? "default" : "outline"}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`text-center  ${selectedTone === tone.id ? "rounded-full bg-primary/80" : "rounded-full border-muted-foreground/20"}`}
                  disabled={data.isLoading || isRegenerating}
                >
                  {tone.label}
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              {REPLY_TONES.find(t => t.id === selectedTone)?.description}
            </p>
          </div>





          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center space-x-3">

            </div>

            <div className="flex items-center space-x-3">
              {/* Show Generate button when no AI reply exists */}
              {!review.ai_reply && (
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || data.isLoading}
                  size="sm"
                  variant={isSubscriber ? "outlinePrimary" : "outline"}
                  className={`rounded-full h-10 bg-primary/5 hover:bg-primary/90 p-0 ${isSubscriber ? "" : "text-gray-500"}`}
                  title={isSubscriber ? "Generate AI reply" : "Generating replies requires subscription - click to learn more"}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="flex items-center space-x-2 px-3">
                      <Wand2 className="h-4 w-4" />
                      <span>{isSubscriber ? 'Generate' : 'Generate (Upgrade)'}</span>
                    </div>
                  )}
                </Button>
              )}

              {/* Show Regenerate button when AI reply exists and not posted */}
              {review.ai_reply && review.status !== 'posted' && (
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || data.isLoading}
                  variant="outline"
                  className={`rounded-full w-12 h-12 p-0 ${isSubscriber ? "" : "text-gray-500"}`}
                  title={isSubscriber ? "Regenerate AI reply" : "Regenerating replies requires subscription - click to learn more"}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Only show Approve/Post buttons when there's an AI reply */}
{/*               {review.ai_reply && review.status === 'pending' && (
                <Button
                  onClick={handleApprove}
                  disabled={data.isLoading}
                  size="sm"
                  variant="outlinePrimary"
                  className="rounded-full text-sm px-3 h-10"
                >
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </div>
                </Button>
              )} */}

              {review.ai_reply && (review.status === 'approved' || review.status === 'pending') && (
                <Button
                  onClick={handlePost}
                  disabled={data.isLoading || isPosting}
                  variant={isSubscriber ? "outlinePrimary" : "outline"}
                  className={`rounded-full h-12 ${isSubscriber ? "" : "text-gray-500"}`}
                  title={isSubscriber ? "Post reply" : "Posting requires subscription - click to learn more"}
                >
                  {isPosting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>{isSubscriber ? "Post" : "Post (Upgrade)"}</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
            </div>
            </div>
          </div>

      </DialogContent>
    </Dialog>
  );
}
