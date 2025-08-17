// Supabase Edge Function for Daily Review Sync
// Automatically checks for new reviews for all users at scheduled times

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          user_id: string
          name: string
          google_business_profile_id: string | null
          created_at: string
          updated_at: string
        }
      }
      business_settings: {
        Row: {
          id: string
          business_id: string
          google_credentials: any | null
          last_review_sync: string | null
          sync_enabled: boolean
          auto_sync_enabled: boolean
          auto_sync_slot: string
          created_at: string
          updated_at: string
        }
      }
      reviews: {
        Row: {
          id: string
          business_id: string
          google_review_id: string
          customer_name: string
          rating: number
          review_text: string
          review_date: string
          reply_text: string | null
          reply_status: 'pending' | 'approved' | 'posted'
          created_at: string
          updated_at: string
        }
      }
      activities: {
        Row: {
          id: string
          business_id: string | null
          type: string
          description: string
          metadata: any | null
          created_at: string
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get slot_id from request body
    let slotId = 'slot_1' // default
    try {
      const body = await req.json()
      slotId = body.slot_id || 'slot_1'
    } catch (e) {
      // If no body or invalid JSON, use default slot_1
      console.log('No request body or invalid JSON, using default slot_1')
    }

    // Validate slot_id
    if (!['slot_1', 'slot_2'].includes(slotId)) {
      throw new Error(`Invalid slot_id: ${slotId}. Must be slot_1 or slot_2`)
    }

    // Initialize Supabase client with service role key
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🚀 Starting daily review sync for ${slotId} at`, new Date().toISOString())

    // Get all businesses with Google Business Profile integration enabled for this slot
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select(`
        *,
        business_settings (
          google_credentials,
          last_review_sync,
          auto_sync_enabled,
          auto_sync_slot
        )
      `)
      .eq('business_settings.auto_sync_enabled', true)
      .eq('business_settings.auto_sync_slot', slotId)
      .not('google_business_profile_id', 'is', null)

    if (businessesError) {
      throw new Error(`Failed to fetch businesses: ${businessesError.message}`)
    }

    if (!businesses || businesses.length === 0) {
      console.log(`📭 No businesses with sync enabled found for ${slotId}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No businesses with sync enabled found for ${slotId}`,
          slot_id: slotId,
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📋 Found ${businesses.length} businesses to sync for ${slotId}`)

    let totalSynced = 0
    let totalErrors = 0
    const syncResults = []

    // Process each business
    for (const business of businesses) {
      try {
        console.log(`🔄 Syncing reviews for business: ${business.name}`)

        // Check if business has valid Google credentials
        const settings = business.business_settings?.[0]
        if (!settings?.google_credentials) {
          console.log(`⚠️ Skipping ${business.name} - no Google credentials`)
          continue
        }

        // Call the existing review sync API endpoint
        const syncResponse = await fetch(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/api/reviews/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            businessId: business.id,
            force: false // Only sync new reviews
          })
        })

        if (!syncResponse.ok) {
          throw new Error(`Sync API returned ${syncResponse.status}`)
        }

        const syncResult = await syncResponse.json()
        console.log(`✅ Synced ${syncResult.newReviews || 0} new reviews for ${business.name}`)

        // Update last sync timestamp
        await supabase
          .from('business_settings')
          .update({ last_review_sync: new Date().toISOString() })
          .eq('business_id', business.id)

        // Log activity
        await supabase
          .from('activities')
          .insert({
            business_id: business.id,
            type: 'review_sync_automated',
            description: `Automated daily review sync completed for ${slotId} - ${syncResult.newReviews || 0} new reviews`,
            metadata: {
              source: 'edge_function',
              slot_id: slotId,
              newReviews: syncResult.newReviews || 0,
              totalReviews: syncResult.totalReviews || 0,
              syncTime: new Date().toISOString()
            }
          })

        syncResults.push({
          businessId: business.id,
          businessName: business.name,
          newReviews: syncResult.newReviews || 0,
          success: true
        })

        totalSynced++

      } catch (error) {
        console.error(`❌ Error syncing ${business.name}:`, error)
        totalErrors++

        // Log error activity
        await supabase
          .from('activities')
          .insert({
            business_id: business.id,
            type: 'review_sync_error',
            description: `Automated review sync failed for ${slotId}: ${error.message}`,
            metadata: {
              source: 'edge_function',
              slot_id: slotId,
              error: error.message,
              syncTime: new Date().toISOString()
            }
          })

        syncResults.push({
          businessId: business.id,
          businessName: business.name,
          error: error.message,
          success: false
        })
      }
    }

    console.log(`📊 Daily sync complete for ${slotId}: ${totalSynced} successful, ${totalErrors} errors`)

    // If there were significant errors, optionally send alert email
    if (totalErrors > 0 && totalErrors > totalSynced * 0.5) {
      console.log(`⚠️ High error rate detected for ${slotId}, consider sending admin alert`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily review sync completed for ${slotId}`,
        slot_id: slotId,
        processed: businesses.length,
        successful: totalSynced,
        errors: totalErrors,
        results: syncResults,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error(`❌ Daily review sync failed for ${slotId || 'unknown'}:`, error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        slot_id: slotId || 'unknown',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})