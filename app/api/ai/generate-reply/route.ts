import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Check subscription status for access control
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle();

    const isSubscriber = subscription && 
      subscription.status === 'active' && 
      new Date(subscription.current_period_end) > new Date();

    if (!isSubscriber) {
      return NextResponse.json(
        { 
          error: 'Subscription required',
          message: 'AI reply generation requires an active subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }
    
    // Build system prompt based on brand voice settings
    const systemPrompt = buildSystemPrompt(brandVoice, businessInfo);
    
    // Build user prompt with review details
    const userPrompt = buildUserPrompt(review);
    
    // Log the final prompts for debugging
    console.log('\n===== SYSTEM PROMPT =====\n', systemPrompt);
    console.log('\n===== USER PROMPT =====\n', userPrompt);
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: mapTemperature(brandVoice),
      max_tokens: 300, // Set to a generous limit, we'll trim by words later
      n: 1,
    });
    
    // Extract and validate response
    let reply = completion.choices[0]?.message?.content?.trim();
    
    if (!reply) {
      throw new Error('No reply generated');
    }
    
    // Trim by word count based on brevity setting
    const maxWords = mapMaxWords(brandVoice.brevity);
    reply = trimToWordLimit(reply, maxWords);
    
    // Return the generated reply
    return NextResponse.json({
      reply,
      tone: brandVoice.preset,
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

// Helper functions
// Forbidden AI words that make text sound artificial
const FORBIDDEN_WORDS = [
  // Overly enthusiastic words
  'thrilled', 'delighted', 'ecstatic', 'elated', 'overjoyed', 'blown away',
  // Clichéd phrases  
  'absolutely', 'truly', 'genuinely', 'sincerely', 'incredibly', 'extremely', 'utterly',
  // AI-typical transitions
  'furthermore', 'moreover', 'additionally', 'in addition', 'what\'s more', 'on top of that',
  // Overly formal closings
  'rest assured', 'please don\'t hesitate', 'we look forward to', 'at your earliest convenience',
  'should you have any questions', 'please feel free to reach out',
  // Generic enthusiasm  
  'amazing', 'fantastic', 'wonderful', 'marvelous', 'spectacular', 'phenomenal', 'outstanding', 'exceptional',
  // Robotic phrases
  'as an AI', 'I understand that', 'I appreciate', 'it is important to note', 'please note that',
  // Overused business speak
  'leverage', 'synergy', 'paradigm', 'utilize', 'facilitate', 'optimize', 'streamline', 'enhance',
  // Excessive gratitude
  'immensely grateful', 'deeply appreciate', 'profoundly thankful', 'beyond grateful',
  // Artificial connectors
  'that being said', 'with that in mind', 'moving forward', 'going forward', 'at the end of the day',
  // Common AI review responses
  'means the world to us', 'made our day', 'over the moon', 'this review warms our hearts',
  'your kind words mean everything', 'we\'re so grateful for customers like you',
  // Corporate speak
  'commitment to excellence', 'exceed your expectations', 'valued customer', 'top priority'
];

function buildSystemPrompt(brandVoice: { preset: string; formality: number; warmth: number; brevity: number; customInstruction?: string }, businessInfo: { name: string; industry: string }) {
  const { preset, formality, warmth, brevity, customInstruction } = brandVoice;
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
  
  basePrompt += 'Your task is to respond to customer reviews in a way that represents the business well. ';
  
  // Add custom instruction if provided
  if (customInstruction && customInstruction.trim()) {
    basePrompt += `CUSTOM INSTRUCTIONS: ${customInstruction.trim()} `;
  }
  
  // Add forbidden words instruction
  basePrompt += `IMPORTANT: Write like a real human, not an AI. Avoid these overused AI words and phrases: ${FORBIDDEN_WORDS.join(', ')}. `;
  basePrompt += 'Use natural, conversational language that sounds authentic and genuine. Avoid corporate jargon and overly enthusiastic phrases.';
  
  return basePrompt;
}

function buildUserPrompt(review: { rating: number; text: string; customerName: string }) {
  const { rating, text, customerName } = review;
  
  return `Please write a reply to this ${rating}-star review from ${customerName}:

"${text}"

Your reply should be appropriate for the rating, acknowledge their feedback, and thank them for their business.`;
}

function mapTemperature(brandVoice: { preset: string }) {
  // More creative for playful, more deterministic for professional
  if (brandVoice.preset === 'playful') return 0.7;
  if (brandVoice.preset === 'professional') return 0.3;
  return 0.5; // Default for friendly and custom
}

function mapMaxWords(brevity: number) {
  // Map brevity (1-10) to word range
  // Brevity 1 = most detailed, 10 = most concise
  if (brevity <= 3) return 80; // Detailed responses (60-80 words)
  if (brevity <= 7) return 50; // Moderate responses (40-50 words) 
  return 30; // Concise responses (20-30 words)
}

function trimToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return text;
  }
  
  // Trim to word limit
  let trimmed = words.slice(0, maxWords).join(' ');
  
  // Ensure proper sentence ending
  // If the trimmed text doesn't end with punctuation, try to find a good stopping point
  if (!/[.!?]$/.test(trimmed)) {
    // Look backwards for the last complete sentence
    const sentences = text.match(/[^.!?]*[.!?]/g);
    if (sentences) {
      let combined = '';
      for (const sentence of sentences) {
        const testCombined = (combined + ' ' + sentence).trim();
        const testWords = testCombined.split(/\s+/);
        if (testWords.length <= maxWords) {
          combined = testCombined;
        } else {
          break;
        }
      }
      if (combined && combined.length > 0) {
        return combined;
      }
    }
    
    // If we can't find complete sentences, add a period to complete the thought
    trimmed += '.';
  }
  
  return trimmed;
}