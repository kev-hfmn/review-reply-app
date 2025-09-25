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
  'thrilled', 'delighted', 'ecstatic', 'stoked', 'pumped', 'elated', 'overjoyed', 'blown away', 'stoked',
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
  'commitment to excellence', 'exceed your expectations', 'valued customer', 'top priority',
  // Common repetitive phrases
  'glad that you', 'we\'re glad you', 'so glad', 'thank you for your kind words',
  'we appreciate your feedback', 'means a lot to us'
];

// Alternative opening phrases for variety
const POSITIVE_OPENERS = [
  'I appreciate you sharing this',
  'It\'s wonderful to hear',
  'We\'re grateful for your note',
  'Thanks for taking time to write this',
  'Glad this stood out for you',
  'So nice to hear',
  'Good to know this worked well',
  'Thanks for calling that out',
  'We love hearing this',
  'We\'re happy this helped',
  'What great feedback',
  'This made our day'
];

const NEGATIVE_NEUTRAL_OPENERS = [
  'I\'m sorry this happened',
  'Thanks for flagging this',
  'We hear you',
  'This isn\'t the experience we aim for',
  'We\'d like to help fix this',
  'I appreciate the candid feedback',
  'We\'ll look into this',
  'Thanks for bringing this to our attention',
  'We want to make this right',
  'This is valuable feedback'
];

/**
 * Clean em dashes and en dashes from AI-generated text to prevent AI detection
 * Replaces various dash types with regular hyphens for more natural text
 */
function cleanEmDashes(text: string): string {
  return text
    .replace(/[—–]/g, ', ')
    .replace(/--/g, ', ')
    .replace(/\s+,\s+/g, ', ')
    .replace(/,\s*,/g, ',');
}

function buildSystemPrompt(
  brandVoice: BrandVoiceSettings,
  businessInfo: BusinessInfo,
  options?: { avoidPhrases?: string[], varietySalt?: string }
) {
  const { preset, formality, warmth, customInstruction } = brandVoice;
  const { name, industry, contactEmail, phone } = businessInfo;

  // Compact, high-salience schema to improve adherence (kept minimal)
  const toneLabel = preset;
  const emojiPolicy = preset === 'playful' ? 'at most one if natural' : 'none';
  const schemaBlock = `"""
PROMPT_SPEC:
  version: 1
  output:
    type: reply_text
    format: single paragraph, no quotes, no lists
  constraints:
    must_not_start_with: ["we", "we're", "we are", "thank", "thanks", "so"]
    punctuation:
      em_dash: forbidden
      en_dash: forbidden
    forbidden_phrases_examples: ["we're glad", "so glad", "we appreciate"]
    length:
      source: user_prompt_word_range
  style:
    tone: ${toneLabel}
    formality: ${formality}
    warmth: ${warmth}
    emoji: ${emojiPolicy}
  brand:
    name: ${name}
    industry: ${industry}
  behavior:
    variety:
      opener: short, natural
      sentence_starts: vary
    truthfulness: no invented facts
    references: use reviewer's wording for specifics, do not just copy words
""" `;

  let basePrompt = `You are a senior customer support representative for ${name}, a ${industry} business. ` +
    `Write replies to Google reviews that sound natural, specific, and human. Avoid clichés. `;

  // Prepend the schema block without changing the rest of the prompt
  basePrompt = schemaBlock + basePrompt;

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
    basePrompt += `Custom brand instructions (IMPORTANT TO FOLLOW!): ${customInstruction.trim()} `;
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

  // Anti-generic phrasing and variety guidance
  basePrompt +=
    'NEVER EVER USE ANY OF THE FOLLOWING robotic phrases: ' +
    FORBIDDEN_WORDS.join(', ') +
    '. Prefer simple, human phrasing. ';

  // Add variety guidance with alternative openers
  basePrompt += 'DO NOT start replies with any of these phrases:  "We\'re glad", "So glad", "We appreciate", "I\'m glad", "Glad to hear", "We\'re happy", "We\'re thrilled", "We\'re delighted". ';
  basePrompt += 'Start with a short, natural opener. Vary the structure across regenerations. ';

  // Add context-aware avoidance if provided
  if (options?.avoidPhrases && options.avoidPhrases.length > 0) {
    basePrompt += 'Do not use these exact phrases from recent replies: ' +
      options.avoidPhrases.join(', ') + '. ';
  }

  // Add variety salt for natural randomization
  if (options?.varietySalt) {
    basePrompt += `Variety context: ${options.varietySalt}. `;
  }

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
      baseMaxWords = isLowRating ? 25 : 15;
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
    '• Make sure to exactly follow the instructions above. Also follow the custom brand instructions very carefully! ' +
    '• Use natural punctuation with no dashes. ' +
    '• End on a short, human-sounding line. ' +
    'Write exactly within the word range above.';

  return prompt;
}

function mapTemperature(brandVoice: BrandVoiceSettings) {
  // Base temperature on preset (wider range for better variety)
  let baseTemp = 0.8;
  if (brandVoice.preset === 'playful') baseTemp = 0.9;
  if (brandVoice.preset === 'professional') baseTemp = 0.5;

  // Adjust based on formality (1-5): higher formality = slightly lower creativity
  const formalityAdjustment = (brandVoice.formality - 3) * -0.04; // -0.08 to +0.08

  // Adjust based on warmth (1-5): higher warmth = slightly higher creativity
  const warmthAdjustment = (brandVoice.warmth - 3) * 0.03; // -0.06 to +0.06

  // Calculate final temperature
  const finalTemp = baseTemp + formalityAdjustment + warmthAdjustment;

  // Clamp between 0.4 and 0.9 for better variety while maintaining quality
  return Math.max(0.4, Math.min(0.9, finalTemp));
}

/**
 * Calculate frequency penalty based on brand voice
 */
function mapFrequencyPenalty(brandVoice: BrandVoiceSettings): number {
  // Base penalty to reduce repetition
  let basePenalty = 0.45;

  // Professional needs less variety, playful needs more
  if (brandVoice.preset === 'professional') basePenalty = 0.35;
  if (brandVoice.preset === 'playful') basePenalty = 0.55;

  // Higher formality = slightly less penalty (more consistent phrasing)
  const formalityAdjustment = (brandVoice.formality - 3) * -0.02;

  return Math.max(0.3, Math.min(0.6, basePenalty + formalityAdjustment));
}

/**
 * Calculate presence penalty for topic diversity
 */
function mapPresencePenalty(brandVoice: BrandVoiceSettings): number {
  // Base penalty for topic diversity
  let basePenalty = 0.2;

  // Playful can be more diverse, professional more focused
  if (brandVoice.preset === 'playful') basePenalty = 0.25;
  if (brandVoice.preset === 'professional') basePenalty = 0.15;

  return Math.max(0.1, Math.min(0.3, basePenalty));
}

/**
 * Calculate dynamic max_tokens based on word count limits
 */
function calculateMaxTokens(review: ReviewData, brandVoice: BrandVoiceSettings): number {
  // Get the word range guidance
  const wordGuidance = getContextualBrevityGuidance(brandVoice.brevity, review);

  // Extract max word count using regex
  const wordRangeMatch = wordGuidance.match(/Word count: (\d+)[–-](\d+) words/);

  if (wordRangeMatch && wordRangeMatch.length >= 3) {
    const maxWords = parseInt(wordRangeMatch[2], 10);

    // Convert max words to tokens (roughly 1.6 tokens per word for English)
    const maxTokens = Math.ceil(maxWords * 1.6);

    // Add a small buffer but keep it reasonable
    return Math.min(maxTokens + 20, 200);
  }

  // Fallback to a reasonable default if we can't parse the word range
  return 120;
}

/**
 * Generate AI reply using OpenAI (server-side only)
 */
export async function generateAIReply(
  review: ReviewData,
  brandVoice: BrandVoiceSettings,
  businessInfo: BusinessInfo,
  options?: { avoidPhrases?: string[] }
): Promise<{ reply: string; tone: string }> {
  // Create variety salt for natural randomization
  const varietySalt = `${review.customerName}#${review.id}#${Date.now() % 1000}`;

  // Always include default banned openings in avoid phrases
  const defaultBannedOpenings = ["we're glad", "so glad", "we appreciate"];
  const combinedAvoidPhrases = [...defaultBannedOpenings, ...(options?.avoidPhrases || [])];

  // Build system prompt based on brand voice settings with anti-repetition context
  const systemPrompt = buildSystemPrompt(brandVoice, businessInfo, {
    avoidPhrases: combinedAvoidPhrases,
    varietySalt
  });

  // Build user prompt with review details and brand voice context
  const userPrompt = buildUserPrompt(review, brandVoice);

  // Get OpenAI client (lazy initialization)
  const openai = getOpenAIClient();

  // Calculate parameters
  const temperature = mapTemperature(brandVoice);
  const frequencyPenalty = mapFrequencyPenalty(brandVoice);
  const presencePenalty = mapPresencePenalty(brandVoice);
  const topP = mapTopP(brandVoice);
  const maxTokens = calculateMaxTokens(review, brandVoice);

  // Enhanced logging for debugging
  console.log('\n=== PROMPT DETAILS ===');
  console.log('Model:', 'gpt-4.1-nano');
  console.log('Review ID:', review.id);
  console.log('Customer:', review.customerName);
  console.log('Rating:', review.rating);
  console.log('Temperature:', temperature);
  console.log('Frequency Penalty:', frequencyPenalty);
  console.log('Presence Penalty:', presencePenalty);
  console.log('Top P:', topP);
  console.log('Max Tokens:', maxTokens);
  console.log('Avoid Phrases Count:', combinedAvoidPhrases.length);
  console.log('\nSystem Prompt:');
  console.log(systemPrompt);
  console.log('\nUser Prompt:');
  console.log(userPrompt);
  console.log('=====================\n');

  // Call OpenAI API with enhanced anti-repetition parameters
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: temperature,
    //frequency_penalty: frequencyPenalty,
    //presence_penalty: presencePenalty,
    top_p: topP,
    max_tokens: maxTokens,
    n: 1,
  });

  // Extract and validate response
  const rawReply = completion.choices[0]?.message?.content?.trim();

  if (!rawReply) {
    throw new Error('No reply generated');
  }

  console.log('✅ Generated reply:', rawReply);

  // Clean em dashes and en dashes to prevent AI detection
  const reply = cleanEmDashes(rawReply);

  return {
    reply,
    tone: brandVoice.preset,
  };
}

function mapTopP(brandVoice: BrandVoiceSettings): number {
  // Base top_p - higher values increase diversity of word choices
  let baseTopP = 0.94;

  // Professional needs less variety, playful needs more
  if (brandVoice.preset === 'professional') baseTopP = 0.88;
  if (brandVoice.preset === 'playful') baseTopP = 0.95;

  return baseTopP;
}
