import { useState, useEffect } from 'react';
import {
  Star,
  User,
  Calendar,
  MessageSquare,
  Wand2,
  Check,
  Send,
  Save,
  Loader2
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ReviewDrawer({
  data,
  onClose,
  onSave,
  onApprove,
  onPost,
  onRegenerate
}: ReviewDrawerProps) {
  const [editedReply, setEditedReply] = useState('');
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when review changes
  useEffect(() => {
    if (data.review) {
      setEditedReply(data.review.ai_reply || '');
      setSelectedTone(data.review.reply_tone || 'friendly');
    }
  }, [data.review, data.review?.ai_reply, data.review?.reply_tone]);

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

    setIsRegenerating(true);
    try {
      await onRegenerate(data.review.id, selectedTone);
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
                <div className="p-2 bg-muted rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {review.customer_name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
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
              <span className="text-sm font-medium text-foreground">
                Status:
              </span>
              <Badge
                variant={review.status as any}
              >
                {review.status === 'needs_edit' ? 'Needs Edit' :
                 review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </Badge>
            </div>

            {/* Review Text */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  Customer Review
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                &ldquo;{review.review_text}&rdquo;
              </p>
            </div>
          </div>

          {/* AI Reply Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">
                AI Reply
              </h3>
              <div className="flex items-center space-x-2">
                <Select value={selectedTone} onValueChange={setSelectedTone}>
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
                </Select>
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || data.isLoading}
                  className="flex items-center space-x-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>Regenerate</span>
                </Button>
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
              {review.status === 'pending' && (
                <Button
                  onClick={handleApprove}
                  disabled={data.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve</span>
                </Button>
              )}

              {(review.status === 'approved' || review.status === 'pending') && (
                <Button
                  onClick={handlePost}
                  disabled={data.isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="h-4 w-4" />
                  <span>Post Reply</span>
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
