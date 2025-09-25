import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'

// Business settings query - cached for 10 minutes since settings change infrequently
export const useBusinessSettingsQuery = (businessId: string | null) => {
  return useQuery({
    queryKey: ['business-settings', businessId],
    queryFn: async () => {
      if (!businessId) return null
      
      const { data, error } = await supabase
        .from('business_settings')
        .select('*, auto_sync_enabled, auto_sync_slot, auto_reply_enabled, auto_post_enabled, email_notifications_enabled, last_automation_run')
        .eq('business_id', businessId)
        .single()
      
      if (error) {
        // Handle case where no settings exist (new business)
        if (error.code === 'PGRST116') {
          return null // Will trigger creation of default settings
        }
        throw error
      }
      
      return data
    },
    enabled: !!businessId,
    staleTime: 10 * 60 * 1000, // 10 minutes - settings change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// User businesses query - cached for 10 minutes, reusing successful pattern from reviews
export const useUserBusinessesQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-businesses', userId],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, industry, connection_status, created_at, location, google_business_id, customer_support_email, customer_support_phone, user_id, updated_at, last_review_sync')
        .eq('user_id', userId)
        .order('connection_status', { ascending: false }) // 'connected' comes before 'disconnected'
        .order('created_at', { ascending: false }) // newest first
      
      if (error) {
        // Only log error if it's not a "no rows" error (PGRST116)
        if (error.code !== 'PGRST116') {
          throw error
        }
        // For new users without business records, this is expected
        return []
      }
      
      return data || []
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - business list changes infrequently  
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Connected businesses query - for settings integrations tab
export const useConnectedBusinessesQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['connected-businesses', userId], 
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, google_business_name, google_location_name, connection_status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return data || []
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - connection status can change
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}