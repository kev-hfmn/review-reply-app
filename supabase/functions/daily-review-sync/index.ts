// Supabase Edge Function for Daily Review Sync - Platform API Compatible
// Automatically checks for new reviews for all users at scheduled times
// Updated to work with Platform API Google Business Profile integration

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
          google_account_id: string | null
          google_location_id: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          connection_status: string
          google_business_name: string | null
          google_location_name: string | null
          last_review_sync: string | null
          created_at: string
          updated_at: string
        }
      }
      business_settings: {
        Row: {
          id: string
          business_id: string
          auto_sync_enabled: boolean
          auto_sync_slot: string
          auto_reply_enabled: boolean
          auto_post_enabled: boolean
          email_notifications_enabled: boolean
          approval_mode: string
          last_automation_run: string | null
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
          status: 'pending' | 'approved' | 'posted' | 'needs_edit' | 'skipped'
          ai_reply: string | null
          final_reply: string | null
          automated_reply: boolean
          automation_failed: boolean
          auto_approved: boolean
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

/**
 * Process the complete automation pipeline for a business after sync
 */
async function processAutomationPipeline(business: any, slotId: string, settings: any) {
  try {
    console.log(`🤖 Checking automation for business: ${business.name}`)

    // Check if automation is enabled
    console.log(`🔍 Checking automation settings for ${business.name}:`)
    console.log(`   - auto_reply_enabled: ${settings?.auto_reply_enabled}`)
    console.log(`   - auto_post_enabled: ${settings?.auto_post_enabled}`)
    
    if (!settings?.auto_reply_enabled && !settings?.auto_post_enabled) {
      console.log(`⏭️ Automation disabled for ${business.name} - neither auto_reply nor auto_post enabled`)
      return {
        enabled: false,
        message: 'Automation disabled - neither auto_reply nor auto_post enabled'
      }
    }

    console.log(`🚀 Processing automation pipeline for ${business.name}`)

    // Get the app URL - prioritize environment variable, fallback to construction
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 
                   `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '').replace('.supabase.co', '')}.vercel.app`;

    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable not set');
    }

    // Call the automation API endpoint
    const automationResponse = await fetch(`${appUrl}/api/automation/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        businessId: business.id,
        userId: business.user_id,
        slotId: slotId,
        triggerType: 'scheduled'
      })
    })

    if (!automationResponse.ok) {
      const errorText = await automationResponse.text()
      throw new Error(`Automation API returned ${automationResponse.status}: ${errorText}`)
    }

    const automationResult = await automationResponse.json()
    console.log(`✅ Automation completed for ${business.name}:`, {
      processed: automationResult.processedReviews,
      generated: automationResult.generatedReplies,
      approved: automationResult.autoApproved,
      posted: automationResult.autoPosted,
      emails: automationResult.emailsSent,
      errors: automationResult.errors?.length || 0
    })

    return {
      enabled: true,
      success: automationResult.success,
      processedReviews: automationResult.processedReviews,
      generatedReplies: automationResult.generatedReplies,
      autoApproved: automationResult.autoApproved,
      autoPosted: automationResult.autoPosted,
      emailsSent: automationResult.emailsSent,
      errors: automationResult.errors?.length || 0,
      duration: automationResult.duration
    }

  } catch (error) {
    console.error(`❌ Automation pipeline failed for ${business.name}:`, error)
    
    return {
      enabled: true,
      success: false,
      error: error.message,
      processedReviews: 0,
      generatedReplies: 0,
      autoApproved: 0,
      autoPosted: 0,
      emailsSent: 0,
      errors: 1
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

    // Get all businesses with Platform API Google Business Profile integration enabled for this slot
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select(`
        *,
        business_settings (
          auto_sync_enabled,
          auto_sync_slot,
          auto_reply_enabled,
          auto_post_enabled,
          email_notifications_enabled,
          approval_mode,
          last_automation_run
        )
      `)
      .eq('business_settings.auto_sync_enabled', true)
      .eq('business_settings.auto_sync_slot', slotId)
      .not('google_account_id', 'is', null)
      .not('google_location_id', 'is', null)
      .not('google_access_token', 'is', null)
      .eq('connection_status', 'connected')

    if (businessesError) {
      throw new Error(`Failed to fetch businesses: ${businessesError.message}`)
    }

    if (!businesses || businesses.length === 0) {
      console.log(`📭 No businesses with Platform API sync enabled found for ${slotId}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No businesses with Platform API sync enabled found for ${slotId}`,
          slot_id: slotId,
          processed: 0,
          platform_api_note: 'Businesses must be connected via Platform API with valid google_account_id and google_location_id'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📋 Found ${businesses.length} Platform API businesses to sync for ${slotId}`)

    let totalSynced = 0
    let totalErrors = 0
    const syncResults = []

    // Process each business
    for (const business of businesses) {
      try {
        console.log(`🔄 Syncing reviews for Platform API business: ${business.name}`)

        // Validate Platform API connection and extract settings robustly
        console.log(`🔍 Business settings structure:`, JSON.stringify(business.business_settings, null, 2))
        
        const settings = Array.isArray(business.business_settings) 
          ? business.business_settings[0] 
          : business.business_settings
          
        console.log(`⚙️ Extracted settings for ${business.name}:`, JSON.stringify(settings, null, 2))
        
        if (!settings) {
          console.log(`⚠️ Skipping ${business.name} - no settings found`)
          continue
        }
        
        if (!business.google_account_id || !business.google_location_id || !business.google_access_token) {
          console.log(`⚠️ Skipping ${business.name} - incomplete Platform API connection`)
          console.log(`   - google_account_id: ${business.google_account_id ? '✓' : '✗'}`)
          console.log(`   - google_location_id: ${business.google_location_id ? '✓' : '✗'}`)
          console.log(`   - google_access_token: ${business.google_access_token ? '✓' : '✗'}`)
          continue
        }

        if (business.connection_status !== 'connected') {
          console.log(`⚠️ Skipping ${business.name} - connection status: ${business.connection_status}`)
          continue
        }

        // Get the app URL for API calls
        const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 
                       `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '').replace('.supabase.co', '')}.vercel.app`;

        if (!appUrl) {
          throw new Error('NEXT_PUBLIC_APP_URL environment variable not set');
        }

        // Call the existing review sync API endpoint
        console.log(`📡 Calling sync API for ${business.name}:`)
        console.log(`   - URL: ${appUrl}/api/reviews/sync`)
        console.log(`   - businessId: ${business.id}`)
        console.log(`   - userId: ${business.user_id}`)
        console.log(`   - force: false`)
        
        const syncResponse = await fetch(`${appUrl}/api/reviews/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            businessId: business.id,
            userId: business.user_id,
            force: false // Only sync new reviews
          })
        })

        console.log(`📊 Sync API response status: ${syncResponse.status}`)
        
        if (!syncResponse.ok) {
          const errorText = await syncResponse.text()
          console.error(`❌ Sync API error response:`, errorText)
          throw new Error(`Sync API returned ${syncResponse.status}: ${errorText}`)
        }

        const syncResult = await syncResponse.json()
        console.log(`📈 Complete sync result for ${business.name}:`, JSON.stringify(syncResult, null, 2))
        console.log(`✅ Synced ${syncResult.newReviews || 0} new reviews for ${business.name}`)

        // Update last sync timestamp
        await supabase
          .from('businesses')
          .update({ last_review_sync: new Date().toISOString() })
          .eq('id', business.id)

        // Check if automation is enabled for this business
        const automationResult = await processAutomationPipeline(business, slotId, settings)

        // Log sync activity with Platform API metadata
        await supabase
          .from('activities')
          .insert({
            business_id: business.id,
            type: 'review_sync_automated',
            description: `Automated Daily Sync Completed - ${syncResult.newReviews || 0} new reviews`,
            metadata: {
              source: 'edge_function',
              slot_id: slotId,
              newReviews: syncResult.newReviews || 0,
              totalReviews: syncResult.totalReviews || 0,
              syncTime: new Date().toISOString(),
              platform_api: true,
              connection_status: business.connection_status,
              google_business_name: business.google_business_name,
              google_location_name: business.google_location_name,
              automation_result: automationResult,
              activity_subtype: 'review_sync_automated'
            }
          })

        syncResults.push({
          businessId: business.id,
          businessName: business.name,
          newReviews: syncResult.newReviews || 0,
          automation: automationResult,
          platformApi: true,
          connectionStatus: business.connection_status,
          success: true
        })

        totalSynced++

      } catch (error) {
        console.error(`❌ Error syncing ${business.name}:`, error)
        totalErrors++

        // Log error activity with Platform API context
        await supabase
          .from('activities')
          .insert({
            business_id: business.id,
            type: 'automation_failed',
            description: `Automated Daily Sync Failed: ${error.message}`,
            metadata: {
              source: 'edge_function',
              slot_id: slotId,
              error: error.message,
              syncTime: new Date().toISOString(),
              platform_api: true,
              connection_status: business.connection_status,
              business_name: business.name,
              activity_subtype: 'review_sync_error'
            }
          })

        syncResults.push({
          businessId: business.id,
          businessName: business.name,
          error: error.message,
          platformApi: true,
          connectionStatus: business.connection_status,
          success: false
        })
      }
    }

    // Calculate automation metrics
    const automationMetrics = syncResults.reduce((acc, result) => {
      if (result.automation?.enabled) {
        acc.automationEnabled++
        if (result.automation.success) {
          acc.automationSuccessful++
          acc.totalProcessed += result.automation.processedReviews || 0
          acc.totalGenerated += result.automation.generatedReplies || 0
          acc.totalApproved += result.automation.autoApproved || 0
          acc.totalPosted += result.automation.autoPosted || 0
          acc.totalEmails += result.automation.emailsSent || 0
        } else {
          acc.automationFailed++
        }
      }
      return acc
    }, {
      automationEnabled: 0,
      automationSuccessful: 0,
      automationFailed: 0,
      totalProcessed: 0,
      totalGenerated: 0,
      totalApproved: 0,
      totalPosted: 0,
      totalEmails: 0
    })

    console.log(`📊 Platform API daily sync complete for ${slotId}:`)
    console.log(`   📈 Sync: ${totalSynced} successful, ${totalErrors} errors`)
    console.log(`   🤖 Automation: ${automationMetrics.automationSuccessful}/${automationMetrics.automationEnabled} successful`)
    console.log(`   ✍️ Generated: ${automationMetrics.totalGenerated} replies`)
    console.log(`   ✅ Approved: ${automationMetrics.totalApproved} reviews`)
    console.log(`   📤 Posted: ${automationMetrics.totalPosted} replies`)
    console.log(`   📧 Emails: ${automationMetrics.totalEmails} sent`)

    // If there were significant errors, optionally send alert email
    if (totalErrors > 0 && totalErrors > totalSynced * 0.5) {
      console.log(`⚠️ High error rate detected for ${slotId}, consider sending admin alert`)
    }

    if (automationMetrics.automationFailed > automationMetrics.automationSuccessful) {
      console.log(`⚠️ High automation failure rate for ${slotId}, consider investigation`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Platform API daily review sync and automation completed for ${slotId}`,
        slot_id: slotId,
        platform_api_version: true,
        sync: {
          processed: businesses.length,
          successful: totalSynced,
          errors: totalErrors
        },
        automation: automationMetrics,
        results: syncResults,
        timestamp: new Date().toISOString(),
        platform_api_note: 'Using Platform API Google Business Profile integration'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error(`❌ Platform API daily review sync failed for ${slotId || 'unknown'}:`, error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        slot_id: slotId || 'unknown',
        platform_api_version: true,
        timestamp: new Date().toISOString(),
        troubleshooting: {
          check_environment: 'Ensure NEXT_PUBLIC_APP_URL is set',
          check_database: 'Verify businesses have google_account_id and google_location_id',
          check_connection: 'Ensure businesses have connection_status = connected'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})