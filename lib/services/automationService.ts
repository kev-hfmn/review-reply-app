import { supabaseAdmin } from '@/utils/supabase-admin';
import { generateAutomatedReply, batchGenerateReplies } from './aiReplyService';
import { AutoApprovalService } from './autoApprovalService';

// Types for automation context and results
export interface AutomationContext {
  businessId: string;
  userId: string;
  slotId: string;
  settings: BusinessSettings;
  newReviews: Review[];
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  brand_voice_preset: string;
  formality_level: number;
  warmth_level: number;
  brevity_level: number;
  custom_instruction?: string;
  approval_mode: 'manual' | 'auto_4_plus' | 'auto_except_low';
  auto_sync_enabled: boolean;
  auto_reply_enabled: boolean;
  auto_post_enabled: boolean;
  email_notifications_enabled: boolean;
  last_automation_run?: string;
  automation_errors: AutomationError[];
}

export interface Review {
  id: string;
  business_id: string;
  google_review_id?: string;
  customer_name: string;
  customer_avatar_url?: string;
  rating: number;
  review_text: string;
  review_date: string;
  status: 'pending' | 'approved' | 'posted' | 'needs_edit' | 'skipped';
  ai_reply?: string;
  final_reply?: string;
  reply_tone?: string;
  posted_at?: string;
  automated_reply: boolean;
  automation_failed: boolean;
  automation_error?: string;
  auto_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationError {
  step: string;
  error: string;
  timestamp: string;
  reviewId?: string;
}

export interface AutomationResult {
  success: boolean;
  processedReviews: number;
  generatedReplies: number;
  autoApproved: number;
  autoPosted: number;
  emailsSent: number;
  errors: AutomationError[];
  duration: number;
}

export interface BatchGenerateResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    reviewId: string;
    success: boolean;
    reply?: string;
    error?: string;
  }>;
}

/**
 * Main automation service that orchestrates the complete automation pipeline
 */
export class AutomationService {
  private autoApprovalService: AutoApprovalService;

  constructor() {
    this.autoApprovalService = new AutoApprovalService();
  }

  /**
   * Process the complete automation pipeline for a business
   */
  async processBusinessAutomation(context: AutomationContext): Promise<AutomationResult> {
    const startTime = Date.now();
    const result: AutomationResult = {
      success: true,
      processedReviews: 0,
      generatedReplies: 0,
      autoApproved: 0,
      autoPosted: 0,
      emailsSent: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Log automation start
      await this.logActivity(context.businessId, 'automation_start', 'Starting automated review processing', {
        slot_id: context.slotId,
        new_reviews_count: context.newReviews.length,
        settings: {
          auto_reply_enabled: context.settings.auto_reply_enabled,
          auto_post_enabled: context.settings.auto_post_enabled,
          approval_mode: context.settings.approval_mode,
        },
      });

      // Filter reviews that need automation (haven't been processed yet)
      const reviewsToProcess = context.newReviews.filter(
        review => !review.automated_reply && !review.automation_failed && review.status === 'pending'
      );

      if (reviewsToProcess.length === 0) {
        await this.logActivity(context.businessId, 'automation_skipped', 'No new reviews to process', {
          slot_id: context.slotId,
          total_reviews: context.newReviews.length,
        });
        return { ...result, duration: Date.now() - startTime };
      }

      result.processedReviews = reviewsToProcess.length;

      // Step 1: Generate AI replies if enabled
      if (context.settings.auto_reply_enabled) {
        const replyResults = await this.generateAIReplies(reviewsToProcess, context);
        result.generatedReplies = replyResults.successCount;
        result.errors.push(...replyResults.errors);
      }

      // Step 2: Apply auto-approval logic if enabled
      if (context.settings.approval_mode !== 'manual') {
        const approvalResults = await this.applyAutoApproval(reviewsToProcess, context);
        result.autoApproved = approvalResults.approvedCount;
        result.errors.push(...approvalResults.errors);
      }

      // Step 3: Post approved replies if enabled
      if (context.settings.auto_post_enabled) {
        const postResults = await this.postApprovedReplies(reviewsToProcess, context);
        result.autoPosted = postResults.postedCount;
        result.errors.push(...postResults.errors);
      }

      // Step 4: Send email notifications if enabled
      if (context.settings.email_notifications_enabled) {
        const emailResults = await this.sendNotifications(reviewsToProcess, context);
        result.emailsSent = emailResults.sentCount;
        result.errors.push(...emailResults.errors);
      }

      // Update last automation run timestamp
      await this.updateLastAutomationRun(context.businessId, result.errors);

      // Log completion
      await this.logActivity(context.businessId, 'automation_completed', 'Automated review processing completed', {
        slot_id: context.slotId,
        processed_reviews: result.processedReviews,
        generated_replies: result.generatedReplies,
        auto_approved: result.autoApproved,
        auto_posted: result.autoPosted,
        emails_sent: result.emailsSent,
        error_count: result.errors.length,
        duration_ms: Date.now() - startTime,
      });

    } catch (error) {
      result.success = false;
      const automationError: AutomationError = {
        step: 'automation_pipeline',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
      result.errors.push(automationError);

      await this.handleAutomationError(automationError, context);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Generate AI replies for reviews
   */
  private async generateAIReplies(
    reviews: Review[],
    context: AutomationContext
  ): Promise<{ successCount: number; errors: AutomationError[] }> {
    const errors: AutomationError[] = [];
    let successCount = 0;

    try {
      // Use batch processing for efficiency
      const batchResult = await batchGenerateReplies(
        reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          text: review.review_text,
          customerName: review.customer_name,
        })),
        context.businessId
      );

      // Update reviews with generated replies
      for (const result of batchResult.results) {
        const review = reviews.find(r => r.id === result.reviewId);
        if (!review) continue;

        if (result.success && result.reply) {
          // Update review with AI reply
          const { error } = await supabaseAdmin
            .from('reviews')
            .update({
              ai_reply: result.reply,
              automated_reply: true,
              automation_failed: false,
              automation_error: null,
              reply_tone: context.settings.brand_voice_preset,
              updated_at: new Date().toISOString(),
            })
            .eq('id', review.id);

          if (error) {
            errors.push({
              step: 'save_ai_reply',
              error: error.message,
              timestamp: new Date().toISOString(),
              reviewId: review.id,
            });
          } else {
            successCount++;

            // Update in-memory review object with AI reply for downstream processing
            review.ai_reply = result.reply;
            review.automated_reply = true;
            review.automation_failed = false;
            review.automation_error = undefined;
            review.reply_tone = context.settings.brand_voice_preset;

            // Log AI reply generation
            await this.logActivity(context.businessId, 'ai_reply_generated',
              `AI reply generated for ${review.rating}-star review from ${review.customer_name}`, {
                review_id: review.id,
                rating: review.rating,
                reply_length: result.reply.length,
                tone: context.settings.brand_voice_preset,
              });
          }
        } else {
          // Mark as failed
          await supabaseAdmin
            .from('reviews')
            .update({
              automation_failed: true,
              automation_error: result.error || 'Failed to generate AI reply',
              updated_at: new Date().toISOString(),
            })
            .eq('id', review.id);

          errors.push({
            step: 'generate_ai_reply',
            error: result.error || 'Failed to generate AI reply',
            timestamp: new Date().toISOString(),
            reviewId: review.id,
          });
        }
      }

    } catch (error) {
      errors.push({
        step: 'batch_generate_replies',
        error: error instanceof Error ? error.message : 'Unknown error in batch generation',
        timestamp: new Date().toISOString(),
      });
    }

    return { successCount, errors };
  }

  /**
   * Apply auto-approval logic to reviews
   */
  private async applyAutoApproval(
    reviews: Review[],
    context: AutomationContext
  ): Promise<{ approvedCount: number; errors: AutomationError[] }> {
    const errors: AutomationError[] = [];
    let approvedCount = 0;

    for (const review of reviews) {
      try {
        // Only process reviews that have AI replies and haven't been processed yet
        if (!review.ai_reply || review.status !== 'pending') continue;

        const shouldApprove = await this.autoApprovalService.shouldAutoApprove(review, {
          mode: context.settings.approval_mode,
          businessId: context.businessId,
          settings: context.settings,
        });

        if (shouldApprove) {
          const reason = this.autoApprovalService.getApprovalReason(review, context.settings.approval_mode);

          await this.autoApprovalService.approveReview(review.id, reason);
          approvedCount++;

          // Update in-memory review object with approved status for downstream processing
          review.status = 'approved';
          review.auto_approved = true;

          // Log auto-approval
          await this.logActivity(context.businessId, 'reply_auto_approved',
            `Auto-approved ${review.rating}-star review reply from ${review.customer_name}`, {
              review_id: review.id,
              rating: review.rating,
              approval_mode: context.settings.approval_mode,
              reason: reason,
            });
        }

      } catch (error) {
        errors.push({
          step: 'auto_approval',
          error: error instanceof Error ? error.message : 'Unknown error in auto-approval',
          timestamp: new Date().toISOString(),
          reviewId: review.id,
        });
      }
    }

    return { approvedCount, errors };
  }

  /**
   * Post approved replies to Google Business Profile
   */
  private async postApprovedReplies(
    reviews: Review[],
    context: AutomationContext
  ): Promise<{ postedCount: number; errors: AutomationError[] }> {
    const errors: AutomationError[] = [];
    let postedCount = 0;

    // Get approved reviews with AI replies
    const approvedReviews = reviews.filter(
      review => review.status === 'approved' && (review.ai_reply || review.final_reply)
    );

    for (const review of approvedReviews) {
      try {
        // Build full URL for API call - required when running in API route context
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}.vercel.app`;
        
        // Call the existing reply posting API with correct field names
        const response = await fetch(`${appUrl}/api/reviews/post-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewId: review.id,
            replyText: review.final_reply || review.ai_reply,  // Fixed: API expects 'replyText', not 'reply'
            userId: context.userId,  // Fixed: Added missing userId field
            businessId: context.businessId,
            automated: true,
          }),
        });

        if (response.ok) {
          postedCount++;

          // Update in-memory review object with posted status for downstream processing
          review.status = 'posted';

          // Log auto-posting
          await this.logActivity(context.businessId, 'reply_auto_posted',
            `Auto-posted reply for ${review.rating}-star review from ${review.customer_name}`, {
              review_id: review.id,
              rating: review.rating,
              reply_length: (review.final_reply || review.ai_reply || '').length,
            });
        } else {
          const errorData = await response.json();
          errors.push({
            step: 'post_reply',
            error: errorData.error || 'Failed to post reply',
            timestamp: new Date().toISOString(),
            reviewId: review.id,
          });
        }

      } catch (error) {
        errors.push({
          step: 'post_reply',
          error: error instanceof Error ? error.message : 'Unknown error posting reply',
          timestamp: new Date().toISOString(),
          reviewId: review.id,
        });
      }
    }

    return { postedCount, errors };
  }

  /**
   * Send email notifications for new reviews and posted replies
   */
  private async sendNotifications(
    reviews: Review[],
    context: AutomationContext
  ): Promise<{ sentCount: number; errors: AutomationError[] }> {
    const errors: AutomationError[] = [];
    let sentCount = 0;

    try {
      // Identify different types of reviews
      const postedReplies = reviews.filter(r => r.status === 'posted');

      // Pending reviews are those with AI replies but not yet posted
      // This includes reviews that need manual approval due to rating or approval mode
      const pendingReviews = reviews.filter(r =>
        r.automated_reply &&
        r.ai_reply &&
        r.status !== 'posted' &&
        r.status !== 'skipped'
      );

      // Determine pending reasons based on approval mode and rating
      const pendingReviewsWithReason = pendingReviews.map(review => {
        let pendingReason: 'low_rating' | 'manual_approval' | 'custom_rule' = 'manual_approval';

        // If approval mode is auto_4_plus and rating is below 4, it's pending due to low rating
        if (context.settings.approval_mode === 'auto_4_plus' && review.rating < 4) {
          pendingReason = 'low_rating';
        }
        // If approval mode is auto_except_low and rating is 1-2, it's pending due to low rating
        else if (context.settings.approval_mode === 'auto_except_low' && review.rating <= 2) {
          pendingReason = 'low_rating';
        }
        // If approval mode is manual, all reviews need manual approval
        else if (context.settings.approval_mode === 'manual') {
          pendingReason = 'manual_approval';
        }

        return {
          customerName: review.customer_name,
          rating: review.rating,
          reviewText: review.review_text,
          aiReply: review.ai_reply || '',
          reviewDate: review.review_date,
          reviewId: review.id,
          pendingReason
        };
      });

      // Only send email if there are posted replies OR pending reviews
      if (postedReplies.length > 0 || pendingReviews.length > 0) {
        // Build full URL for API call - required when running in API route context
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}.vercel.app`;
      
        // Call email notification API
        const response = await fetch(`${appUrl}/api/email/automation-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: context.businessId,
            userId: context.userId,
            newReviews: reviews.filter(r => r.status === 'pending' || r.status === 'approved').length,
            postedReplies: postedReplies.length,
            slotId: context.slotId,
            approvalMode: context.settings.approval_mode,
            postedReviews: postedReplies.map(review => ({
              customerName: review.customer_name,
              rating: review.rating,
              reviewText: review.review_text,
              replyText: review.final_reply || review.ai_reply || '',
              reviewDate: review.review_date,
              reviewId: review.id
            })),
            pendingReviews: pendingReviewsWithReason,
            automationResult: {
              processedReviews: reviews.length,
              generatedReplies: reviews.filter(r => r.automated_reply).length,
              autoApproved: reviews.filter(r => r.auto_approved).length,
              autoPosted: postedReplies.length,
            },
          }),
        });

        if (response.ok) {
          sentCount = 1; // One summary email sent

          // Log email notification
          await this.logActivity(context.businessId, 'email_notification_sent',
            'Automation summary email sent', {
              slot_id: context.slotId,
              new_reviews: reviews.length,
              posted_replies: postedReplies.length,
            });
        } else {
          const errorData = await response.json();
          errors.push({
            step: 'send_notification',
            error: errorData.error || 'Failed to send notification email',
            timestamp: new Date().toISOString(),
          });
        }
      }

    } catch (error) {
      errors.push({
        step: 'send_notification',
        error: error instanceof Error ? error.message : 'Unknown error sending notifications',
        timestamp: new Date().toISOString(),
      });
    }

    return { sentCount, errors };
  }

  /**
   * Handle automation errors by logging and optionally escalating
   */
  private async handleAutomationError(error: AutomationError, context: AutomationContext): Promise<void> {
    try {
      // Log the error as an activity
      await this.logActivity(context.businessId, 'automation_failed',
        `Automation failed: ${error.error}`, {
          step: error.step,
          error: error.error,
          review_id: error.reviewId,
          slot_id: context.slotId,
        });

      // Update business settings with error
      const { data: currentSettings } = await supabaseAdmin
        .from('business_settings')
        .select('automation_errors')
        .eq('business_id', context.businessId)
        .single();

      if (currentSettings) {
        const errors = Array.isArray(currentSettings.automation_errors)
          ? currentSettings.automation_errors
          : [];

        // Keep only last 10 errors
        const updatedErrors = [error, ...errors].slice(0, 10);

        await supabaseAdmin
          .from('business_settings')
          .update({
            automation_errors: updatedErrors,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', context.businessId);
      }

    } catch (logError) {
      console.error('Failed to log automation error:', logError);
    }
  }

  /**
   * Update last automation run timestamp
   */
  private async updateLastAutomationRun(businessId: string, errors: AutomationError[]): Promise<void> {
    try {
      await supabaseAdmin
        .from('business_settings')
        .update({
          last_automation_run: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId);
    } catch (error) {
      console.error('Failed to update last automation run:', error);
    }
  }

  /**
   * Log activity to the activities table
   */
  private async logActivity(
    businessId: string,
    type: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabaseAdmin.from('activities').insert({
        business_id: businessId,
        type: type as any, // Cast to activity_type enum
        description,
        metadata,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

// Export singleton instance
export const automationService = new AutomationService();
