import { supabase } from '@/utils/supabase';
import type { BrandVoiceSettings, BusinessInfo } from '@/lib/types/aiTypes';

/**
 * CLIENT-SAFE: Fetch business settings using regular supabase client
 * This function can be called from client-side components/hooks
 */
export async function getBusinessSettings(businessId: string): Promise<BrandVoiceSettings | null> {
  try {
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
  } catch (error) {
    console.error('Error in getBusinessSettings:', error);
    return null;
  }
}

/**
 * CLIENT-SAFE: Fetch business info using regular supabase client
 * This function can be called from client-side components/hooks
 */
export async function getBusinessInfo(businessId: string): Promise<BusinessInfo | null> {
  try {
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
  } catch (error) {
    console.error('Error in getBusinessInfo:', error);
    return null;
  }
}