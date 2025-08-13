import { supabase } from '@/utils/supabase';

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
  businessInfo: BusinessInfo
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
    .select('name, industry')
    .eq('id', businessId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching business info:', error);
    return null;
  }
  
  return {
    name: data.name,
    industry: data.industry || 'service',
  };
}