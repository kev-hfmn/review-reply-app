# OpenAI ChatGPT Integration Implementation Plan

## 1. Findings

### 1.1 Current State Analysis

- **OpenAI Dependency**: The project already includes OpenAI as a dependency in `package.json` (version `^4.86.1`), but no actual implementation exists.

- **Mock Implementation**: Currently using template-based replies in `hooks/useReviewsData.ts` (lines 389-450):

```typescript
// Current mock implementation (lines 389-391):
const regenerateReply = async (reviewId: string, tone = 'friendly') => {
  // ...
  // For now, we'll simulate AI reply generation with template responses
  // TODO: Replace with actual AI integration
  // ...
}
```

- **Brand Voice Structure**: The application has a complete settings system with:
  - Presets: 'friendly', 'professional', 'playful', 'custom'
  - Sliders: formality (1-10), warmth (1-10), brevity (1-10)

```typescript
// From app/(app)/settings/page.tsx
interface BrandVoice {
  preset: 'friendly' | 'professional' | 'playful' | 'custom';
  formality: number; // 1-10
  warmth: number;    // 1-10
  brevity: number;   // 1-10
}
```

- **Database Schema**: The `business_settings` table in Supabase is already set up with the necessary fields:

```sql
-- From docs/flowrise-schema.sql
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  brand_voice_preset TEXT DEFAULT 'friendly',
  formality_level INTEGER CHECK (formality_level >= 1 AND formality_level <= 10) DEFAULT 5,
  warmth_level INTEGER CHECK (warmth_level >= 1 AND warmth_level <= 10) DEFAULT 7,
  brevity_level INTEGER CHECK (brevity_level >= 1 AND brevity_level <= 10) DEFAULT 5,
  -- other fields...
);
```

- **UI Integration Points**: The Reviews page already has all necessary UI components:
  - Reviews table with AI reply column
  - Review drawer with tone selection
  - Regenerate button functionality
  - Toast notifications for success/error states

### 1.2 OpenAI API Research

- **Recommended Model**: `gpt-4o-mini` offers the best balance of quality and cost-effectiveness for this use case.

- **API Structure**: The Chat Completions API is most appropriate for generating contextual replies.

- **Environment Setup**: Requires `OPENAI_API_KEY` in `.env.local`.

## 2. Results

Based on the analysis, we can implement OpenAI integration with minimal changes to the existing codebase:

1. **No UI Changes Required**: All necessary UI components already exist.

2. **No Database Schema Changes**: The `reviews` table already has an `ai_reply` field.

3. **Simple API Integration**: We only need to create a server-side API route and update the existing hook.

4. **Brand Voice Mapping**: The existing settings can be directly mapped to prompt engineering parameters.

## 3. Recommendations

### 3.1 Architecture Recommendations

- **Server-Side API Calls**: Keep OpenAI API key secure by only making calls from server-side API routes.

- **Service Layer Pattern**: Create a dedicated service for AI functionality to maintain separation of concerns.

- **Graceful Degradation**: Maintain the template system as a fallback if the API fails.

- **Cost Management**: Implement caching for identical requests and set token limits.

### 3.2 Implementation Recommendations

- **Phased Approach**: Implement in 5 phases (API route, brand voice integration, service layer, hook integration, environment setup).

- **Prompt Engineering**: Use system prompts to define the role and context injection for business-specific replies.

- **Error Handling**: Implement comprehensive error handling with user-friendly messages.

## 4. Solution

### 4.1 API Route Implementation

Create a new API route at `app/api/ai/generate-reply/route.ts`:

```typescript
// app/api/ai/generate-reply/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase-server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { review, brandVoice, businessInfo } = await request.json();
    
    // Validate required fields
    if (!review || !review.text || !brandVoice || !businessInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Build system prompt based on brand voice settings
    const systemPrompt = buildSystemPrompt(brandVoice, businessInfo);
    
    // Build user prompt with review details
    const userPrompt = buildUserPrompt(review);
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: mapTemperature(brandVoice),
      max_tokens: mapMaxTokens(brandVoice.brevity),
      n: 1,
    });
    
    // Extract and validate response
    const reply = completion.choices[0]?.message?.content?.trim();
    
    if (!reply) {
      throw new Error('No reply generated');
    }
    
    // Return the generated reply
    return NextResponse.json({
      reply,
      tone: brandVoice.preset,
      confidence: 0.95, // Placeholder for potential future confidence scoring
    });
    
  } catch (error: any) {
    console.error('AI reply generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reply' },
      { status: 500 }
    );
  }
}

// Helper functions
function buildSystemPrompt(brandVoice: any, businessInfo: any) {
  const { preset, formality, warmth, brevity } = brandVoice;
  const { name, industry } = businessInfo;
  
  let basePrompt = `You are an expert customer service representative for ${name}, a business in the ${industry} industry. `;
  
  // Add tone guidance based on preset
  if (preset === 'friendly') {
    basePrompt += 'Your tone is warm, approachable, and conversational. ';
  } else if (preset === 'professional') {
    basePrompt += 'Your tone is polished, respectful, and business-appropriate. ';
  } else if (preset === 'playful') {
    basePrompt += 'Your tone is fun, energetic, and uses appropriate emojis. ';
  }
  
  // Add formality guidance
  if (formality <= 3) {
    basePrompt += 'Use casual, everyday language. ';
  } else if (formality <= 7) {
    basePrompt += 'Use a balanced, conversational tone. ';
  } else {
    basePrompt += 'Use formal, professional language. ';
  }
  
  // Add warmth guidance
  if (warmth <= 3) {
    basePrompt += 'Keep emotional expression minimal. ';
  } else if (warmth <= 7) {
    basePrompt += 'Show appropriate empathy and appreciation. ';
  } else {
    basePrompt += 'Be very warm, enthusiastic, and emotionally expressive. ';
  }
  
  // Add brevity guidance
  if (brevity <= 3) {
    basePrompt += 'Keep responses very concise and to the point. ';
  } else if (brevity <= 7) {
    basePrompt += 'Use moderate length responses with some detail. ';
  } else {
    basePrompt += 'Provide detailed, thorough responses. ';
  }
  
  basePrompt += 'Your task is to respond to customer reviews in a way that represents the business well.';
  
  return basePrompt;
}

function buildUserPrompt(review: any) {
  const { rating, text, customerName } = review;
  
  return `Please write a reply to this ${rating}-star review from ${customerName}:\n\n"${text}"\n\nYour reply should be appropriate for the rating, acknowledge their feedback, and thank them for their business.`;
}

function mapTemperature(brandVoice: any) {
  // More creative for playful, more deterministic for professional
  if (brandVoice.preset === 'playful') return 0.7;
  if (brandVoice.preset === 'professional') return 0.3;
  return 0.5; // Default for friendly and custom
}

function mapMaxTokens(brevity: number) {
  // Map brevity (1-10) to token range (50-150)
  return Math.floor(50 + (brevity - 1) * 10);
}
```

### 4.2 Service Layer Implementation

Create a service file at `lib/services/aiReplyService.ts`:

```typescript
// lib/services/aiReplyService.ts
import { createClient } from '@/utils/supabase-client';

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
  } catch (error: any) {
    console.error('Error generating AI reply:', error);
    
    // Fall back to template system
    const fallbackReply = getFallbackReply(review, brandVoice.preset);
    
    return {
      reply: fallbackReply,
      tone: brandVoice.preset,
      error: error.message,
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
  
  return template(review.customer_name);
}

/**
 * Fetch business settings from Supabase
 */
export async function getBusinessSettings(businessId: string): Promise<BrandVoiceSettings | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('business_settings')
    .select('brand_voice_preset, formality_level, warmth_level, brevity_level')
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
  };
}

/**
 * Fetch business info from Supabase
 */
export async function getBusinessInfo(businessId: string): Promise<BusinessInfo | null> {
  const supabase = createClient();
  
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
```

### 4.3 Hook Integration

Update the `useReviewsData.ts` hook to use the new AI service:

```typescript
// hooks/useReviewsData.ts - update the regenerateReply function
import { generateReply, getBusinessSettings, getBusinessInfo } from '@/lib/services/aiReplyService';

// ...

const regenerateReply = async (reviewId: string, tone = 'friendly') => {
  try {
    setIsUpdating(true);
    
    // Find the review
    const review = reviews.find(r => r.id === reviewId);
    if (!review) throw new Error('Review not found');
    
    // Get business settings and info
    const businessId = review.business_id;
    const settings = await getBusinessSettings(businessId);
    const businessInfo = await getBusinessInfo(businessId);
    
    if (!settings || !businessInfo) {
      throw new Error('Could not retrieve business settings');
    }
    
    // Override tone if specified
    const brandVoice = {
      ...settings,
      preset: tone || settings.preset
    };
    
    // Generate AI reply
    const result = await generateReply(
      {
        id: review.id,
        rating: review.rating,
        text: review.review_text,
        customerName: review.customer_name
      },
      brandVoice,
      businessInfo
    );
    
    // Update in Supabase
    const { error } = await supabase
      .from('reviews')
      .update({ 
        ai_reply: result.reply,
        reply_tone: tone,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);
    
    if (error) throw error;
    
    // Show success message
    showToast({
      type: 'success',
      title: 'Reply regenerated',
      message: `A new ${tone} reply has been generated.`
    });
    
    // Refresh reviews
    await fetchReviews();
  } catch (err) {
    console.error('Failed to regenerate reply:', err);
    showToast({
      type: 'error',
      title: 'Failed to regenerate reply',
      message: err instanceof Error ? err.message : 'Please try again.'
    });
  } finally {
    setIsUpdating(false);
  }
};
```

### 4.4 Environment Setup

Update `.env.example` to include the OpenAI API key:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

Update `README.md` with setup instructions:

```markdown
## OpenAI Integration Setup

1. Sign up for an OpenAI API key at https://platform.openai.com/
2. Add your API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
3. The application uses the `gpt-4o-mini` model for optimal cost/quality balance
```

### 4.5 Example Prompts and Responses

#### Example 1: 5-Star Review with Friendly Tone

**System Prompt:**
```
You are an expert customer service representative for Flowrise Cafe, a business in the Food & Beverage industry. Your tone is warm, approachable, and conversational. Use a balanced, conversational tone. Show appropriate empathy and appreciation. Use moderate length responses with some detail. Your task is to respond to customer reviews in a way that represents the business well.
```

**User Prompt:**
```
Please write a reply to this 5-star review from Jane:

"I absolutely loved my experience at Flowrise Cafe! The coffee was perfect and the staff was so friendly. The atmosphere was cozy and I got so much work done. Will definitely be back!"

Your reply should be appropriate for the rating, acknowledge their feedback, and thank them for their business.
```

**Expected Response:**
```
Hi Jane! Thank you so much for your wonderful 5-star review! We're thrilled to hear you enjoyed your coffee and found our team friendly. Creating that cozy, productive atmosphere is exactly what we aim for at Flowrise Cafe. It makes our day knowing you had such a positive experience with us! We can't wait to welcome you back soon for another perfect cup. Thanks again for taking the time to share your feedback! 😊
```

#### Example 2: 3-Star Review with Professional Tone

**System Prompt:**
```
You are an expert customer service representative for Flowrise Dental, a business in the Healthcare industry. Your tone is polished, respectful, and business-appropriate. Use formal, professional language. Keep emotional expression minimal. Keep responses very concise and to the point. Your task is to respond to customer reviews in a way that represents the business well.
```

**User Prompt:**
```
Please write a reply to this 3-star review from Michael:

"The dentist was good but I had to wait 30 minutes past my appointment time. The office was clean but the reception staff seemed disorganized. Might try somewhere else next time."

Your reply should be appropriate for the rating, acknowledge their feedback, and thank them for their business.
```

**Expected Response:**
```
Dear Michael,

Thank you for your feedback regarding your recent visit to Flowrise Dental. We appreciate your positive comments about our dentist and facility cleanliness. We sincerely apologize for the extended wait time and reception experience. Your observations have been shared with our team as we continuously strive to improve our service standards. We value your patronage and would welcome the opportunity to provide you with a more efficient experience in the future.

Regards,
Flowrise Dental Management
```

## 5. Implementation Timeline

1. **Day 1**: Create API route and service layer
2. **Day 2**: Update hook integration and test with mock data
3. **Day 3**: Environment setup and end-to-end testing
4. **Day 4**: Performance optimization and error handling improvements
5. **Day 5**: Documentation and final review

## 6. Conclusion

This implementation plan provides a comprehensive approach to integrating OpenAI's ChatGPT into the Flowrise Reviews application with minimal changes to the existing codebase. The solution leverages the existing UI components and database schema while adding the necessary server-side functionality to generate AI-powered replies that match the business's brand voice settings.

By following this plan, the development team can quickly implement a robust, maintainable, and cost-effective AI reply generation system that enhances the core functionality of the application while maintaining a high level of user experience.