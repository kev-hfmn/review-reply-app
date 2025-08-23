import { supabase } from '@/utils/supabase';
import { generateAIReply } from './openaiService';

export interface ReviewData {
  id: string;
  rating: number;
  text: string;
  customerName: string;
}

export interface BrandVoiceSettings {
  preset: 'friendly' | 'professional' | 'playful' | 'custom';
  formality: number;
  warmth: number;
  brevity: number;
  customInstruction?: string;
}

export interface BusinessInfo {
  name: string;
  industry: string;
  contactEmail?: string;
  phone?: string;
}

export interface GenerateReplyResult {
  reply: string;
  tone: string;
  error?: string;
}

// Template fallbacks (copied from current implementation)
const toneTemplates = {
  friendly: {
    5: (name: string) => `Thank you so much, ${name}! We're thrilled you had such a wonderful experience with us. Your kind words truly make our day! 😊`,
    4: (name: string) => `Thank you for the great review, ${name}! We're so glad you enjoyed your experience. We appreciate your feedback and hope to see you again soon!`,
    3: (name: string) => `Hi ${name}, thank you for taking the time to share your feedback. We're glad you had a decent experience and would love to make it even better next time!`,
    2: (name: string) => `Hi ${name}, thank you for your honest feedback. We're sorry we didn't meet your expectations and would love the opportunity to improve your experience.`,
    1: (name: string) => `${name}, we're truly sorry about your experience. This isn't the standard we strive for. Please contact us directly so we can make this right.`
  },
  professional: {
    5: (name: string) => `Dear ${name}, we sincerely appreciate your excellent review. Your satisfaction is our top priority, and we look forward to serving you again.`,
    4: (name: string) => `Dear ${name}, thank you for your positive feedback. We value your business and appreciate you taking the time to share your experience.`,
    3: (name: string) => `Dear ${name}, we appreciate your feedback. We strive for excellence and would welcome the opportunity to exceed your expectations in the future.`,
    2: (name: string) => `Dear ${name}, thank you for bringing this to our attention. We take all feedback seriously and are committed to improving our service.`,
    1: (name: string) => `Dear ${name}, we apologize for not meeting your expectations. Please contact our management team so we can address your concerns properly.`
  },
  playful: {
    5: (name: string) => `Wow, ${name}! You just made our whole team do a happy dance! 🎉 Thanks for the amazing review - you're absolutely wonderful!`,
    4: (name: string) => `Hey ${name}! Thanks for the awesome review! We're doing a little celebration dance over here 💃 Hope to see you again soon!`,
    3: (name: string) => `Hi ${name}! Thanks for the feedback - we're pretty good, but we know we can be GREAT! Can't wait to wow you next time! ⭐`,
    2: (name: string) => `Hey ${name}, oops! Looks like we missed the mark this time. We promise we're usually more awesome than this! Let us make it up to you! 😅`,
    1: (name: string) => `Oh no, ${name}! We really dropped the ball here 😔 This is definitely not our usual style - please let us make this right!`
  }
};

/**
 * Generate an AI reply for a review using OpenAI
 */
export async function generateReply(
  review: ReviewData,
  brandVoice: BrandVoiceSettings,
  businessInfo: BusinessInfo,
  userId?: string
): Promise<GenerateReplyResult> {
  try {
    // Call our API route
    const response = await fetch('/api/ai/generate-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        review,
        brandVoice,
        businessInfo,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate reply');
    }

    const data = await response.json();
    return {
      reply: data.reply,
      tone: brandVoice.preset,
    };
  } catch (error: unknown) {
    console.error('Error generating AI reply:', error);

    // Fall back to template system
    const fallbackReply = getFallbackReply(review, brandVoice.preset);

    return {
      reply: fallbackReply,
      tone: brandVoice.preset,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a fallback reply from templates if AI generation fails
 */
function getFallbackReply(review: ReviewData, tone: string = 'friendly'): string {
  const templates = toneTemplates[tone as keyof typeof toneTemplates] || toneTemplates.friendly;
  const ratingKey = review.rating as keyof typeof templates;
  const template = templates[ratingKey] || templates[3];

  return template(review.customerName);
}

/**
 * Fetch business settings from Supabase
 */
export async function getBusinessSettings(businessId: string): Promise<BrandVoiceSettings | null> {

  const { data, error } = await supabase
    .from('business_settings')
    .select('brand_voice_preset, formality_level, warmth_level, brevity_level, custom_instruction')
    .eq('business_id', businessId)
    .single();

  if (error || !data) {
    console.error('Error fetching business settings:', error);
    return null;
  }

  return {
    preset: data.brand_voice_preset as 'friendly' | 'professional' | 'playful' | 'custom',
    formality: data.formality_level,
    warmth: data.warmth_level,
    brevity: data.brevity_level,
    customInstruction: data.custom_instruction,
  };
}

/**
 * Fetch business info from Supabase
 */
export async function getBusinessInfo(businessId: string): Promise<BusinessInfo | null> {

  const { data, error } = await supabase
    .from('businesses')
    .select('name, industry, customer_support_email, customer_support_phone')
    .eq('id', businessId)
    .single();

  if (error || !data) {
    console.error('Error fetching business info:', error);
    return null;
  }

  return {
    name: data.name,
    industry: data.industry || 'service',
    contactEmail: data.customer_support_email || undefined,
    phone: data.customer_support_phone || undefined,
  };
}

/**
 * Interface for batch generation results
 */
export interface BatchGenerateResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    reviewId: string;
    success: boolean;
    reply?: string;
    error?: string;
  }>;
  errors: Array<{
    step: string;
    error: string;
    timestamp: string;
    reviewId?: string;
  }>;
}

/**
 * Generate AI reply for a single review (automated version)
 */
export async function generateAutomatedReply(
  review: ReviewData,
  businessId: string
): Promise<GenerateReplyResult> {
  try {
    // Get business settings and info
    const [brandVoice, businessInfo] = await Promise.all([
      getBusinessSettings(businessId),
      getBusinessInfo(businessId),
    ]);

    if (!brandVoice || !businessInfo) {
      throw new Error('Missing business configuration');
    }

    // Use the existing generateReply function
    return await generateReply(review, brandVoice, businessInfo);

  } catch (error: unknown) {
    console.error('Error generating automated reply:', error);

    // Fall back to template system
    const fallbackReply = getFallbackReply(review);

    return {
      reply: fallbackReply,
      tone: 'friendly',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate AI replies for multiple reviews in batches
 */
export async function batchGenerateReplies(
  reviews: ReviewData[],
  businessId: string,
  batchSize: number = 5,
  brandVoice?: BrandVoiceSettings,
  businessInfo?: BusinessInfo
): Promise<BatchGenerateResult> {
  const result: BatchGenerateResult = {
    successCount: 0,
    failureCount: 0,
    results: [],
    errors: [],
  };

  if (reviews.length === 0) {
    return result;
  }

  try {
    // Use provided business configuration or fetch it (for backward compatibility)
    let finalBrandVoice = brandVoice;
    let finalBusinessInfo = businessInfo;

    if (!finalBrandVoice || !finalBusinessInfo) {
      const [fetchedBrandVoice, fetchedBusinessInfo] = await Promise.all([
        getBusinessSettings(businessId),
        getBusinessInfo(businessId),
      ]);
      
      finalBrandVoice = finalBrandVoice || fetchedBrandVoice || undefined;
      finalBusinessInfo = finalBusinessInfo || fetchedBusinessInfo || undefined;
    }

    if (!finalBrandVoice || !finalBusinessInfo) {
      const error = {
        step: 'fetch_business_config',
        error: 'Missing business configuration',
        timestamp: new Date().toISOString(),
      };
      result.errors.push(error);

      // Mark all reviews as failed
      for (const review of reviews) {
        result.results.push({
          reviewId: review.id,
          success: false,
          error: 'Missing business configuration',
        });
        result.failureCount++;
      }
      return result;
    }

    // Process reviews in batches to avoid overwhelming the API
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(async (review) => {
        try {
          // Use server-side OpenAI service directly (no fetch call)
          const aiResult = await generateAIReply(review, finalBrandVoice, finalBusinessInfo);

          result.results.push({
            reviewId: review.id,
            success: true,
            reply: aiResult.reply,
            error: undefined,
          });

          result.successCount++;

        } catch (error) {
          result.failureCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          result.results.push({
            reviewId: review.id,
            success: false,
            error: errorMessage,
          });

          result.errors.push({
            step: 'generate_reply',
            error: errorMessage,
            timestamp: new Date().toISOString(),
            reviewId: review.id,
          });
        }
      });

      // Wait for current batch to complete before processing next batch
      await Promise.all(batchPromises);

      // Add a small delay between batches to be respectful to the OpenAI API
      if (i + batchSize < reviews.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown batch processing error';
    result.errors.push({
      step: 'batch_processing',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Mark any remaining reviews as failed
    for (const review of reviews) {
      const existing = result.results.find(r => r.reviewId === review.id);
      if (!existing) {
        result.results.push({
          reviewId: review.id,
          success: false,
          error: errorMessage,
        });
        result.failureCount++;
      }
    }
  }

  return result;
}

/**
 * Generate AI replies using bulk API endpoint (more efficient for large batches)
 */
export async function generateBulkReplies(
  reviews: ReviewData[],
  businessId: string
): Promise<BatchGenerateResult> {
  try {
    // Call the bulk generation API endpoint
    const response = await fetch('/api/ai/generate-bulk-replies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviews,
        businessId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate bulk replies');
    }

    const data = await response.json();
    return data;

  } catch (error: unknown) {
    console.error('Error generating bulk replies:', error);

    // Fallback to batch processing
    return await batchGenerateReplies(reviews, businessId);
  }
}

/**
 * Retry failed reply generations
 */
export async function retryFailedReplies(
  businessId: string,
  _maxRetries: number = 3
): Promise<BatchGenerateResult> {
  try {
    // Get reviews that failed automation
    const { data: failedReviews, error } = await supabase
      .from('reviews')
      .select('id, rating, review_text, customer_name')
      .eq('business_id', businessId)
      .eq('automation_failed', true)
      .is('ai_reply', null)
      .limit(20); // Process max 20 retries at once

    if (error) {
      throw new Error(`Failed to fetch failed reviews: ${error.message}`);
    }

    if (!failedReviews || failedReviews.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        results: [],
        errors: [],
      };
    }

    // Convert to ReviewData format
    const reviewsToRetry: ReviewData[] = failedReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      text: review.review_text,
      customerName: review.customer_name,
    }));

    // Retry generation
    const result = await batchGenerateReplies(reviewsToRetry, businessId, 3);

    // Update database with results
    for (const reviewResult of result.results) {
      if (reviewResult.success && reviewResult.reply) {
        // Clear failed status and add reply
        await supabase
          .from('reviews')
          .update({
            ai_reply: reviewResult.reply,
            automated_reply: true,
            automation_failed: false,
            automation_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reviewResult.reviewId);
      } else {
        // Update error status
        await supabase
          .from('reviews')
          .update({
            automation_error: reviewResult.error || 'Retry failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reviewResult.reviewId);
      }
    }

    return result;

  } catch (error) {
    console.error('Error retrying failed replies:', error);
    return {
      successCount: 0,
      failureCount: 0,
      results: [],
      errors: [{
        step: 'retry_failed_replies',
        error: error instanceof Error ? error.message : 'Unknown retry error',
        timestamp: new Date().toISOString(),
      }],
    };
  }
}
