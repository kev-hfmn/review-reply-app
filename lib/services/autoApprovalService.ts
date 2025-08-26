import { supabaseAdmin } from '@/utils/supabase-admin';

export type ApprovalMode = 'manual' | 'auto_4_plus' | 'auto_except_low';

export interface ApprovalContext {
  mode: ApprovalMode;
  businessId: string;
  settings: {
    approval_mode: ApprovalMode;
    [key: string]: any;
  };
}

export interface Review {
  id: string;
  business_id: string;
  rating: number;
  review_text: string;
  customer_name: string;
  status: 'pending' | 'approved' | 'posted' | 'needs_edit' | 'skipped';
  ai_reply?: string;
  final_reply?: string;
  auto_approved: boolean;
}

/**
 * Service that handles automatic approval logic for reviews
 */
export class AutoApprovalService {

  /**
   * Determine if a review should be auto-approved based on business settings
   */
  async shouldAutoApprove(review: Review, context: ApprovalContext): Promise<boolean> {
    // Don't auto-approve if mode is manual
    if (context.mode === 'manual') {
      return false;
    }

    // Don't auto-approve if no AI reply exists
    if (!review.ai_reply && !review.final_reply) {
      return false;
    }

    // Don't auto-approve if already processed
    if (review.status !== 'pending') {
      return false;
    }

    // Apply approval logic based on mode
    switch (context.mode) {
      case 'auto_4_plus':
        // Auto-approve 4 and 5-star reviews
        return review.rating >= 4;

      case 'auto_except_low':
        // Auto-approve all except 1 and 2-star reviews
        return review.rating >= 3;

      default:
        return false;
    }
  }

  /**
   * Approve a review and update its status
   */
  async approveReview(reviewId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({
          status: 'approved',
          auto_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) {
        throw new Error(`Failed to approve review: ${error.message}`);
      }

      // Log the approval activity
      await this.logApprovalActivity(reviewId, reason);

    } catch (error) {
      console.error('Error approving review:', error);
      throw error;
    }
  }

  /**
   * Get a human-readable reason for auto-approval
   */
  getApprovalReason(review: Review, mode: ApprovalMode): string {
    switch (mode) {
      case 'auto_4_plus':
        return `Auto-approved ${review.rating}-star review (4+ star policy)`;
      
      case 'auto_except_low':
        return `Auto-approved ${review.rating}-star review (except low ratings policy)`;
      
      default:
        return `Auto-approved ${review.rating}-star review`;
    }
  }

  /**
   * Batch approve multiple reviews
   */
  async batchApproveReviews(
    reviewIds: string[], 
    context: ApprovalContext
  ): Promise<{ approvedCount: number; errors: string[] }> {
    let approvedCount = 0;
    const errors: string[] = [];

    for (const reviewId of reviewIds) {
      try {
        // Get the review details
        const { data: review, error: fetchError } = await supabaseAdmin
          .from('reviews')
          .select('*')
          .eq('id', reviewId)
          .single();

        if (fetchError || !review) {
          errors.push(`Review ${reviewId}: ${fetchError?.message || 'Not found'}`);
          continue;
        }

        // Check if should auto-approve
        const shouldApprove = await this.shouldAutoApprove(review, context);

        if (shouldApprove) {
          const reason = this.getApprovalReason(review, context.mode);
          await this.approveReview(reviewId, reason);
          approvedCount++;
        }

      } catch (error) {
        errors.push(`Review ${reviewId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { approvedCount, errors };
  }

  /**
   * Get approval statistics for a business
   */
  async getApprovalStats(businessId: string, days: number = 30): Promise<{
    totalReviews: number;
    autoApproved: number;
    manualApproved: number;
    pending: number;
    autoApprovalRate: number;
  }> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: reviews, error } = await supabaseAdmin
        .from('reviews')
        .select('status, auto_approved')
        .eq('business_id', businessId)
        .gte('created_at', since.toISOString());

      if (error) {
        throw new Error(`Failed to fetch approval stats: ${error.message}`);
      }

      const totalReviews = reviews?.length || 0;
      const autoApproved = reviews?.filter(r => r.auto_approved).length || 0;
      const manualApproved = reviews?.filter(r => r.status === 'approved' && !r.auto_approved).length || 0;
      const pending = reviews?.filter(r => r.status === 'pending').length || 0;
      const autoApprovalRate = totalReviews > 0 ? (autoApproved / totalReviews) * 100 : 0;

      return {
        totalReviews,
        autoApproved,
        manualApproved,
        pending,
        autoApprovalRate,
      };

    } catch (error) {
      console.error('Error getting approval stats:', error);
      return {
        totalReviews: 0,
        autoApproved: 0,
        manualApproved: 0,
        pending: 0,
        autoApprovalRate: 0,
      };
    }
  }

  /**
   * Update approval mode for a business
   */
  async updateApprovalMode(businessId: string, mode: ApprovalMode): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('business_settings')
        .update({
          approval_mode: mode,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId);

      if (error) {
        throw new Error(`Failed to update approval mode: ${error.message}`);
      }

      // Log the settings change
      await supabaseAdmin.from('activities').insert({
        business_id: businessId,
        type: 'settings_updated',
        description: `Auto-approval mode changed to: ${mode}`,
        metadata: {
          setting: 'approval_mode',
          new_value: mode,
          changed_at: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Error updating approval mode:', error);
      throw error;
    }
  }

  /**
   * Get reviews that are eligible for auto-approval
   */
  async getEligibleReviews(businessId: string, mode: ApprovalMode): Promise<Review[]> {
    if (mode === 'manual') {
      return [];
    }

    try {
      let ratingFilter = '';
      
      switch (mode) {
        case 'auto_4_plus':
          ratingFilter = 'gte.4';
          break;
        case 'auto_except_low':
          ratingFilter = 'gte.3';
          break;
      }

      const { data: reviews, error } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .filter('rating', ratingFilter)
        .not('ai_reply', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch eligible reviews: ${error.message}`);
      }

      return reviews || [];

    } catch (error) {
      console.error('Error getting eligible reviews:', error);
      return [];
    }
  }

  /**
   * Preview what would happen with auto-approval for pending reviews
   */
  async previewAutoApproval(businessId: string, mode: ApprovalMode): Promise<{
    wouldApprove: number;
    wouldSkip: number;
    byRating: Record<number, { approve: number; skip: number }>;
  }> {
    try {
      const { data: pendingReviews, error } = await supabaseAdmin
        .from('reviews')
        .select('rating, ai_reply')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .not('ai_reply', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch pending reviews: ${error.message}`);
      }

      const reviews = pendingReviews || [];
      let wouldApprove = 0;
      let wouldSkip = 0;
      const byRating: Record<number, { approve: number; skip: number }> = {
        1: { approve: 0, skip: 0 },
        2: { approve: 0, skip: 0 },
        3: { approve: 0, skip: 0 },
        4: { approve: 0, skip: 0 },
        5: { approve: 0, skip: 0 },
      };

      for (const review of reviews) {
        const shouldApprove = await this.shouldAutoApprove(review as Review, {
          mode,
          businessId,
          settings: { approval_mode: mode },
        });

        if (shouldApprove) {
          wouldApprove++;
          byRating[review.rating].approve++;
        } else {
          wouldSkip++;
          byRating[review.rating].skip++;
        }
      }

      return { wouldApprove, wouldSkip, byRating };

    } catch (error) {
      console.error('Error previewing auto-approval:', error);
      return {
        wouldApprove: 0,
        wouldSkip: 0,
        byRating: {
          1: { approve: 0, skip: 0 },
          2: { approve: 0, skip: 0 },
          3: { approve: 0, skip: 0 },
          4: { approve: 0, skip: 0 },
          5: { approve: 0, skip: 0 },
        },
      };
    }
  }

  /**
   * Log approval activity to the activities table
   */
  private async logApprovalActivity(reviewId: string, reason: string): Promise<void> {
    try {
      // Get review details for logging
      const { data: review } = await supabaseAdmin
        .from('reviews')
        .select('business_id, rating, customer_name')
        .eq('id', reviewId)
        .single();

      if (review) {
        await supabaseAdmin.from('activities').insert({
          business_id: review.business_id,
          type: 'reply_auto_approved',
          description: reason,
          metadata: {
            review_id: reviewId,
            rating: review.rating,
            customer_name: review.customer_name,
            approved_at: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to log approval activity:', error);
    }
  }
}