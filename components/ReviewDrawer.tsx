import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  User, 
  Calendar, 
  MessageSquare, 
  Wand2, 
  Check, 
  Send,
  Save,
  SkipForward,
  Loader2
} from 'lucide-react';
import type { ReviewDrawerProps } from '@/types/reviews';
import { REPLY_TONES } from '@/types/reviews';

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
  }, [data.review]);

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
      // Error handling is done in the parent component
    }
  };

  const handlePost = async () => {
    if (!data.review) return;
    
    try {
      await onPost(data.review.id);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!data.review) return null;

  const review = data.review;
  const hasChanges = editedReply !== (review.ai_reply || '') || selectedTone !== (review.reply_tone || 'friendly');

  return (
    <AnimatePresence>
      {data.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-neutral-dark shadow-xl z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Review Details
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Review Info */}
                <div className="space-y-4">
                  {/* Customer & Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {review.customer_name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(review.review_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status:
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      review.status === 'pending' ? 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800' :
                      review.status === 'approved' ? 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800' :
                      review.status === 'posted' ? 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800' :
                      review.status === 'needs_edit' ? 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800' :
                      'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800'
                    }`}>
                      {review.status === 'needs_edit' ? 'Needs Edit' : 
                       review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                  </div>

                  {/* Review Text */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Customer Review
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      "{review.review_text}"
                    </p>
                  </div>
                </div>

                {/* AI Reply Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      AI Reply
                    </h3>
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {REPLY_TONES.map(tone => (
                          <option key={tone.id} value={tone.id}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                      <button
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
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={editedReply}
                      onChange={(e) => setEditedReply(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={6}
                      placeholder="AI reply will appear here..."
                      disabled={data.isLoading || isRegenerating}
                    />
                    
                    {/* Tone Description */}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {REPLY_TONES.find(t => t.id === selectedTone)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {hasChanges && (
                      <button
                        onClick={handleSave}
                        disabled={isSaving || data.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {review.status === 'pending' && (
                      <button
                        onClick={handleApprove}
                        disabled={data.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Check className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                    )}

                    {(review.status === 'approved' || review.status === 'pending') && (
                      <button
                        onClick={handlePost}
                        disabled={data.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <Send className="h-4 w-4" />
                        <span>Post Reply</span>
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}