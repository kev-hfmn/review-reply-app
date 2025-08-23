import { motion } from 'framer-motion';
import { Check, Send, SkipForward, X, Loader2, Sparkles } from 'lucide-react';
import type { BulkActionsBarProps } from '@/types/reviews';
import { Button } from '@/components/ui/button';

export default function BulkActionsBar({
  selection,
  onApprove,
  onPost,
  onSkip,
  onGenerateReplies,
  onClearSelection,
  isLoading = false,
  isSubscriber = false,
  onUpgradeRequired
}: BulkActionsBarProps) {
  if (selection.selectedIds.size === 0) {
    return null;
  }

  const selectedCount = selection.selectedIds.size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-white dark:bg-neutral-dark shadow-lg border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-white text-sm font-medium px-2 py-1 rounded-md min-w-[24px] text-center">
              {selectedCount}
            </div>
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
              review{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={isSubscriber ? onGenerateReplies : onUpgradeRequired}
              disabled={isLoading}
              className={`${
                isSubscriber 
                  ? "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400" 
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white`}
              size="sm"
              title={isSubscriber ? "Generate AI replies for selected reviews" : "AI generation requires subscription"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{isSubscriber ? "Generate Replies" : "Generate (Upgrade)"}</span>
            </Button>

            <Button
              onClick={onApprove}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white"
              size="sm"
              title="Approve selected reviews"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Approve</span>
            </Button>

            <Button
              onClick={isSubscriber ? onPost : onUpgradeRequired}
              disabled={isLoading}
              className={`${
                isSubscriber 
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400" 
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white`}
              size="sm"
              title={isSubscriber ? "Post selected replies" : "Posting requires subscription - click to learn more"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSubscriber ? "Post" : "Post (Upgrade Required)"}</span>
            </Button>

            <Button
              onClick={onSkip}
              disabled={isLoading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white"
              size="sm"
              title="Skip selected reviews"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SkipForward className="h-4 w-4" />
              )}
              <span>Skip</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

          {/* Clear Selection */}
          <Button
            onClick={onClearSelection}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress indicator for bulk actions */}
        {isLoading && (
          <div className="mt-3">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Processing {selectedCount} review{selectedCount > 1 ? 's' : ''}...
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}