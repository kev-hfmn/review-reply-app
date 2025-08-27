import { NextResponse } from 'next/server';
import { checkUserSubscription } from '@/lib/utils/subscription';
import { generateAIReply } from '@/lib/services/openaiService';
import type { BrandVoiceSettings, BusinessInfo, ReviewData } from '@/lib/types/aiTypes';

export async function POST(request: Request) {
  try {
    const { review, brandVoice, businessInfo, userId } = await request.json();

    // Validate required fields
    if (!review || !review.text || !brandVoice || !businessInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check subscription status using centralized utility
    const subscriptionStatus = await checkUserSubscription(userId);

    if (!subscriptionStatus.isSubscriber) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: 'AI reply generation requires an active subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }

    // Convert to proper types
    const reviewData: ReviewData = {
      id: review.id || 'single-generation',
      rating: review.rating,
      text: review.text,
      customerName: review.customerName,
    };

    const brandVoiceSettings: BrandVoiceSettings = {
      preset: brandVoice.preset,
      formality: brandVoice.formality,
      warmth: brandVoice.warmth,
      brevity: brandVoice.brevity,
      customInstruction: brandVoice.customInstruction,
    };

    const businessInfoData: BusinessInfo = {
      name: businessInfo.name,
      industry: businessInfo.industry,
      contactEmail: businessInfo.contactEmail,
      phone: businessInfo.phone,
    };

    // Use the centralized OpenAI service
    const result = await generateAIReply(reviewData, brandVoiceSettings, businessInfoData);

    // Return the generated reply
    return NextResponse.json({
      reply: result.reply,
      tone: result.tone,
      confidence: 0.95, // Placeholder for potential future confidence scoring
    });

  } catch (error: unknown) {
    console.error('AI reply generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
