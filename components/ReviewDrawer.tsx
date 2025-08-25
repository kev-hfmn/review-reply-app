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

  // Update local state when review changes
  useEffect(() => {
    if (data.review) {
      console.log('ReviewDrawer: updating state with ai_reply:', data.review.ai_reply);
      setEditedReply(data.review.ai_reply || '');
      setSelectedTone(data.review.reply_tone || 'friendly');
    }
  }, [data.review?.ai_reply, data.review?.reply_tone, data.review?.id]);

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
    if (!data.review) return;

    // Check subscription before proceeding
    if (!isSubscriber) {
      onUpgradeRequired?.();
      return;
    }

    setIsRegenerating(true);
    try {
      console.log('Before regenerate - current ai_reply:', data.review.ai_reply);
      console.log('Before regenerate - editedReply state:', editedReply);

      await onRegenerate(data.review.id, selectedTone);

      // Force immediate update - we'll get the new data via props
      setTimeout(() => {
        if (data.review?.ai_reply) {
          console.log('Forcing update with new ai_reply:', data.review.ai_reply);
          setEditedReply(data.review.ai_reply);
        }
      }, 300);

    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!data.review) return;

    setIsSaving(true);
    try {
      await onSave(data.review.id, editedReply, selectedTone);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!data.review) return;

    try {
      await onApprove(data.review.id);
    } catch (error) {
      console.error('Error approving review:', error);
      // Error handling is done in the parent component
    }
  };

  const handlePost = async () => {
    if (!data.review) return;

    // Check subscription before proceeding
    if (!isSubscriber) {
      onUpgradeRequired?.();
      return;
    }

    try {
      await onPost(data.review.id);
    } catch (error) {
      console.error('Error posting review:', error);
      // Error handling is done in the parent component
    }
  };

  if (!data.review) return null;

  const review = data.review;
  const hasChanges = editedReply !== (review.ai_reply || '') || selectedTone !== (review.reply_tone || 'friendly');

  return (
    <Dialog open={data.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Review Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Review Info */}
          <div className="space-y-4">
            {/* Customer & Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={review.customer_avatar_url}
                  alt={`${review.customer_name}'s avatar`}
                  size="lg"
                />
                <div>
                  <h3 className="font-medium text-foreground">
                    {review.customer_name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(review.review_date)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-lg font-light text-muted-foreground">
                  {review.rating}/5
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                Status:
              </span>
              <Badge
                variant={review.status as 'default' | 'secondary' | 'destructive' | 'outline'}
              >
                {review.status === 'needs_edit' ? 'Needs Edit' :
                 review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </Badge>
              {/* Posted timestamp - show when reply was posted to Google */}
              {review.status === 'posted' && review.posted_at && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">

                  <span>
                   on {formatDate(review.posted_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Review Text */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  Customer Review
                </span>
              </div>
              <p className="text-foreground leading-relaxed">
                &ldquo;{review.review_text}&rdquo;
              </p>
            </div>
          </div>

          {/* AI Reply Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-md font-medium text-foreground/80">
                Your Reply
              </span>
              <div className="flex items-center space-x-2">
{/*                 <Select value={selectedTone} onValueChange={setSelectedTone}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPLY_TONES.map(tone => (
                      <SelectItem key={tone.id} value={tone.id}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
              </div>
            </div>

            <div className="space-y-2">
              <Textarea
                value={editedReply}
                onChange={(e) => setEditedReply(e.target.value)}
                className="resize-none"
                rows={6}
                placeholder="AI reply will appear here..."
                disabled={data.isLoading || isRegenerating}
              />

              {/* Tone Description */}
              <p className="text-sm text-muted-foreground">
                {REPLY_TONES.find(t => t.id === selectedTone)?.description}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving || data.isLoading}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Show Generate button when no AI reply exists */}
              {!review.ai_reply && (
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || data.isLoading}
                  variant={isSubscriber ? "outlineSecondary" : "outline"}
                  className={isSubscriber ? "" : "text-gray-500"}
                  title={isSubscriber ? "Generate AI reply" : "Generating replies requires subscription - click to learn more"}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>{isRegenerating ? 'Generating...' : isSubscriber ? 'Generate Reply' : 'Generate (Upgrade)'}</span>
                </Button>
              )}

              {/* Show Regenerate button when AI reply exists */}
              {review.ai_reply && (
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || data.isLoading}
                  variant={isSubscriber ? "outlineSecondary" : "outline"}
                  className={isSubscriber ? "" : "text-gray-500"}
                  title={isSubscriber ? "Regenerate AI reply" : "Regenerating replies requires subscription - click to learn more"}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>{isRegenerating ? 'Regenerating...' : isSubscriber ? 'Regenerate' : 'Regenerate (Upgrade)'}</span>
                </Button>
              )}

              {/* Only show Approve/Post buttons when there's an AI reply */}
              {review.ai_reply && review.status === 'pending' && (
                <Button
                  onClick={handleApprove}
                  disabled={data.isLoading}
                  variant="outlinePrimary"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve</span>
                </Button>
              )}

              {review.ai_reply && (review.status === 'approved' || review.status === 'pending') && (
                <Button
                  onClick={handlePost}
                  disabled={data.isLoading}
                  variant={isSubscriber ? "outlineGreen" : "outline"}
                  className={`${
                    isSubscriber
                      ? ""
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  title={isSubscriber ? "Post reply" : "Posting requires subscription - click to learn more"}
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubscriber ? "Post Reply" : "Post (Upgrade)"}</span>
                </Button>
              )}


            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
