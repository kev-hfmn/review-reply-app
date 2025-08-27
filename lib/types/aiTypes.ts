/**
 * Shared type definitions for AI services
 * These types can be imported by both client and server code
 */

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