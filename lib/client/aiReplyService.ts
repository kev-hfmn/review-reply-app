import type { ReviewData, BrandVoiceSettings, BusinessInfo, GenerateReplyResult } from '@/lib/types/aiTypes';

// Template fallbacks (copied from server implementation)
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
 * CLIENT-SAFE: Generate an AI reply for a review using API call
 * This function can be called from client-side components/hooks
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