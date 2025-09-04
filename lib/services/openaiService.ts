import OpenAI from 'openai';
import { BrandVoiceSettings, BusinessInfo, ReviewData } from '@/lib/types/aiTypes';

// Lazy initialization of OpenAI client to ensure environment variables are loaded
function getOpenAIClient() {
  // Debug environment variable loading
  console.log('🔍 OpenAI API Key Debug (runtime):', {
    exists: !!process.env.OPENAI_API_KEY,
    length: process.env.OPENAI_API_KEY?.length || 0,
    prefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'undefined'
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing or empty');
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Curated forbidden words - only the most robotic AI phrases
const FORBIDDEN_WORDS = [
  // Overly enthusiastic words that sound fake
  'thrilled', 'delighted', 'ecstatic', 'elated', 'overjoyed', 'blown away', 'stoked',
  // Robotic AI phrases
  'as an AI', 'I understand that', 'I appreciate', 'it is important to note', 'please note that',
  // Overly formal closings that sound automated
  'rest assured', 'please don\'t hesitate', 'we look forward to', 'at your earliest convenience',
  'should you have any questions', 'please feel free to reach out',
  // Artificial connectors
  'that being said', 'with that in mind', 'moving forward', 'going forward', 'at the end of the day',
  // Generic AI review responses
  'means the world to us', 'made our day', 'over the moon', 'this review warms our hearts',
  'your kind words mean everything', 'we\'re so grateful for customers like you',
  // Corporate speak
  'commitment to excellence', 'exceed your expectations', 'valued customer', 'top priority'
];

/**
 * Clean em dashes and en dashes from AI-generated text to prevent AI detection
 * Replaces various dash types with regular hyphens for more natural text
 */
function cleanEmDashes(text: string): string {
  return text
    .replace(/—/g, ' - ')  // Em dash to regular dash
    .replace(/–/g, ' - ')  // En dash to regular dash
    .replace(/--/g, ' - '); // Double dash to single dash
}

function buildSystemPrompt(brandVoice: BrandVoiceSettings, businessInfo: BusinessInfo) {
  const { preset, formality, warmth, customInstruction } = brandVoice;
  const { name, industry, contactEmail, phone } = businessInfo;

  let basePrompt = `You are a senior customer support representative for ${name}, a ${industry} business. ` +
    `Write replies to Google reviews that sound natural, specific, and human. Avoid clichés. `;

  // Tone presets
  if (preset === 'friendly') basePrompt += 'Tone: warm, approachable, concise. ';
  else if (preset === 'professional') basePrompt += 'Tone: polished, respectful, concise. ';
  else if (preset === 'playful') basePrompt += 'Tone: light and upbeat. A single tasteful emoji is ok only if it fits naturally. ';

  // Formality scale
  const formalityText: Record<number, string> = {
    1: 'Use very casual phrasing with contractions.',
    2: 'Use casual phrasing with contractions.',
    3: 'Use neutral, conversational business language.',
    4: 'Use formal business language with few contractions.',
    5: 'Use very formal business language with no contractions.'
  };
  basePrompt += `${formalityText[formality] || 'Use neutral, conversational language.'} `;

  // Warmth scale
  const warmthText: Record<number, string> = {
    1: 'Keep it factual and restrained.',
    2: 'Be polite and measured.',
    3: 'Be empathetic but not effusive.',
    4: 'Be warm and personable.',
    5: 'Be very warm and people-oriented (without sounding gushy).'
  };
  basePrompt += `${warmthText[warmth] || 'Be empathetic but not effusive.'} `;

  // Core rules
  basePrompt +=
    'Rules: ' +
    '1) Reference 1–2 specific details from the review to prove you read it. ' +
    '2) Do not reuse generic openers such as "Thank you for your kind words" or "We appreciate your feedback." ' +
    '3) If rating is 1–3, acknowledge the issue plainly, apologize once if appropriate, and offer a next step. ' +
    (contactEmail ? `Offer a contact path such as ${contactEmail}. ` : '') +
    (phone ? `A phone number like ${phone} is fine if relevant. ` : '') +
    '4) Keep it tight—no long paragraphs. ' +
    '5) Avoid corporate-speak and filler. ';

  if (customInstruction?.trim()) {
    basePrompt += `Brand instruction: ${customInstruction.trim()} `;
  }

  // Style/format safety
  basePrompt +=
    'Punctuation: NEVER use em dashes or en dashes. ' +
    'Do not write "—" or "–" or "--". Replace these with periods, commas, or "and". ' +
    'Do not invent facts. Use the reviewer\'s wording when referencing specifics. ' +
    'No hashtags. No links unless explicitly provided. ';

  // Emoji policy
  if (preset === 'playful') basePrompt += 'Emoji policy: at most one emoji and only if it feels natural. ';
  else basePrompt += 'Do not use emojis. ';

  // Anti-generic phrasing
  basePrompt +=
    'Avoid robotic phrases including: ' +
    FORBIDDEN_WORDS.join(', ') +
    '. Prefer simple, human phrasing. Vary sentence starts. ';

  return basePrompt;
}

function getContextualBrevityGuidance(brevity: number, review: ReviewData): string {
  const isLowRating = review.rating <= 3;
  const reviewWordCount = review.text.split(/\s+/).length;

  // Base word limits by brevity level
  let baseMaxWords: number;
  let baseMinWords: number;

  switch (brevity) {
    case 1: // Very detailed
      baseMaxWords = isLowRating ? 80 : 60;
      baseMinWords = isLowRating ? 50 : 35;
      break;
    case 2: // Detailed
      baseMaxWords = isLowRating ? 60 : 45;
      baseMinWords = isLowRating ? 35 : 25;
      break;
    case 3: // Moderate
      baseMaxWords = isLowRating ? 45 : 35;
      baseMinWords = isLowRating ? 25 : 20;
      break;
    case 4: // Concise
      baseMaxWords = isLowRating ? 35 : 25;
      baseMinWords = isLowRating ? 20 : 15;
      break;
    case 5: // Very concise
      baseMaxWords = isLowRating ? 25 : 18;
      baseMinWords = isLowRating ? 15 : 8;
      break;
    default:
      baseMaxWords = 35;
      baseMinWords = 20;
  }

  // Calculate review length adjustment factor
  // Short reviews (< 10 words): no adjustment
  // Medium reviews (10-30 words): small adjustment
  // Long reviews (30+ words): larger adjustment, especially for low ratings
  let lengthMultiplier = 1.0;

  if (reviewWordCount >= 30) {
    // Long reviews get more response words
    lengthMultiplier = isLowRating ? 1.4 : 1.2;
  } else if (reviewWordCount >= 10) {
    // Medium reviews get slight increase
    lengthMultiplier = isLowRating ? 1.2 : 1.1;
  }
  // Short reviews keep base limits (multiplier = 1.0)

  // Apply length adjustment
  const adjustedMaxWords = Math.round(baseMaxWords * lengthMultiplier);
  const adjustedMinWords = Math.round(baseMinWords * lengthMultiplier);

  // Cap maximum to prevent extremely long responses
  const finalMaxWords = Math.min(adjustedMaxWords, 100);
  const finalMinWords = Math.min(adjustedMinWords, finalMaxWords - 5);

  return `Word count: ${finalMinWords}-${finalMaxWords} words. `;
}

function buildUserPrompt(review: ReviewData, brandVoice: BrandVoiceSettings) {
  const { rating, text, customerName } = review;
  const isLowRating = rating <= 3;

  const wordLimit = getContextualBrevityGuidance(brandVoice.brevity, review);

  const prompt =
    `Write a reply to this ${rating}-star Google review from ${customerName}:\n` +
    `"${text}"\n\n` +
    `${wordLimit}` +
    'Mandatory content requirements: ' +
    '• Mention the reviewer\'s specific detail(s) in your own words. ' +
    (isLowRating
      ? '• Acknowledge the issue, apologize once if appropriate, and offer a next step with a contact path if provided. '
      : '• Thank them naturally and call out 1–2 specifics they mentioned. ') +
    '• Vary your opener. Do not use stock phrases. ' +
    '• Use natural punctuation with no dashes. ' +
    '• End on a short, human-sounding line. ' +
    'Write exactly within the word range above.';

  return prompt;
}

function mapTemperature(brandVoice: BrandVoiceSettings) {
  // Base temperature on preset
  let baseTemp = 0.7;
  if (brandVoice.preset === 'playful') baseTemp = 0.9;
  if (brandVoice.preset === 'professional') baseTemp = 0.4;

  // Adjust based on formality (1-5): higher formality = slightly lower creativity
  const formalityAdjustment = (brandVoice.formality - 3) * -0.03; // -0.06 to +0.06

  // Adjust based on warmth (1-5): higher warmth = slightly higher creativity
  const warmthAdjustment = (brandVoice.warmth - 3) * 0.02; // -0.04 to +0.04

  // Calculate final temperature
  const finalTemp = baseTemp + formalityAdjustment + warmthAdjustment;

  // Clamp between 0.2 and 0.8 for reasonable bounds
  return Math.max(0.2, Math.min(0.8, finalTemp));
}

function calculateMaxTokens(): number {
  // Use a generous token limit since we're controlling length via word count in prompts
  // This ensures the AI doesn't get cut off mid-sentence
  return 400;
}


/**
 * Generate AI reply using OpenAI (server-side only)
 */
export async function generateAIReply(
  review: ReviewData,
  brandVoice: BrandVoiceSettings,
  businessInfo: BusinessInfo
): Promise<{ reply: string; tone: string }> {
  // Build system prompt based on brand voice settings
  const systemPrompt = buildSystemPrompt(brandVoice, businessInfo);

  // Build user prompt with review details and brand voice context
  const userPrompt = buildUserPrompt(review, brandVoice);

  // Get OpenAI client (lazy initialization)
  const openai = getOpenAIClient();

  console.log('System Prompt:', systemPrompt);
  console.log('User Prompt:', userPrompt);

  // Call OpenAI API
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: mapTemperature(brandVoice),
    max_tokens: calculateMaxTokens(),
    n: 1,
  });

  // Extract and validate response
  const rawReply = completion.choices[0]?.message?.content?.trim();

  if (!rawReply) {
    throw new Error('No reply generated');
  }

  // Clean em dashes and en dashes to prevent AI detection
  const reply = cleanEmDashes(rawReply);

  return {
    reply,
    tone: brandVoice.preset,
  };
}
