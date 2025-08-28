import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { automationService, type AutomationContext, type BusinessSettings, type Review } from '@/lib/services/automationService';
import { errorRecoveryService } from '@/lib/services/errorRecoveryService';
import { checkUserSubscription, hasFeature } from '@/lib/utils/subscription';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { businessId, userId, slotId, triggerType = 'manual' } = body;

    // Validate required parameters
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check subscription status for automation feature
    const subscriptionStatus = await checkUserSubscription(userId);
    if (!hasFeature(subscriptionStatus.planId, 'autoSync')) {
      return NextResponse.json(
        {
          error: 'Automation not available',
          message: 'Automation features require a Pro plan or higher.',
          requiredPlan: 'pro',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      );
    }

    // Verify user has access to this business (using admin client for service role auth)
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Get business settings (using admin client for service role auth)
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Business settings not found' },
        { status: 404 }
      );
    }

    // Check if automation is enabled
    if (!settings.auto_reply_enabled && !settings.auto_post_enabled) {
      return NextResponse.json({
        success: true,
        message: 'Automation is disabled for this business',
        processedReviews: 0,
        generatedReplies: 0,
        autoApproved: 0,
        autoPosted: 0,
        emailsSent: 0,
        errors: [],
        duration: 0,
      });
    }

    // Get reviews that need automation processing
    let reviewQuery = supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .eq('automated_reply', false)
      .eq('automation_failed', false)
      .order('created_at', { ascending: true });

    // Limit to recent reviews if this is a scheduled trigger
    if (triggerType === 'scheduled') {
      // Only process reviews created in the last 24 hours (captures daily sync window)
      // This ensures we only process newly synced reviews, not old pending ones
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      reviewQuery = reviewQuery.gte('created_at', twentyFourHoursAgo.toISOString());
    }

    const { data: reviews, error: reviewsError } = await reviewQuery.limit(50); // Process max 50 reviews at once

    if (reviewsError) {
      return NextResponse.json(
        { error: `Failed to fetch reviews: ${reviewsError.message}` },
        { status: 500 }
      );
    }

    const newReviews = reviews || [];

    // Create automation context
    const automationContext: AutomationContext = {
      businessId,
      userId,
      slotId: slotId || 'manual',
      settings: settings as BusinessSettings,
      newReviews: newReviews as Review[],
    };

    // Process automation pipeline
    const result = await automationService.processBusinessAutomation(automationContext);

    // Log API call
    await supabaseAdmin.from('activities').insert({
      business_id: businessId,
      type: 'automation_failed', // Using existing enum, we'll use metadata to indicate success
      description: `Automation API called via ${triggerType} trigger`,
      metadata: {
        trigger_type: triggerType,
        slot_id: slotId,
        api_endpoint: '/api/automation/process',
        result: {
          success: result.success,
          processed_reviews: result.processedReviews,
          generated_replies: result.generatedReplies,
          auto_approved: result.autoApproved,
          auto_posted: result.autoPosted,
          emails_sent: result.emailsSent,
          error_count: result.errors.length,
        },
        called_at: new Date().toISOString(),
        activity_subtype: result.success ? 'automation_api_success' : 'automation_api_error',
      },
    });

    // Return result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Automation API error:', error);

    // Handle the error using error recovery service
    await errorRecoveryService.handleAutomationFailure({
      step: 'automation_api',
      error: error instanceof Error ? error.message : 'Unknown API error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        error: 'Internal server error during automation processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for automation status/health
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const userId = searchParams.get('userId');

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Get automation health status
    const healthStatus = await errorRecoveryService.getAutomationHealth(businessId);

    // Get recent automation activities
    const { data: recentActivities } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('business_id', businessId)
      .in('type', ['automation_failed', 'ai_reply_generated', 'reply_auto_approved', 'reply_auto_posted'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Get business settings
    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('auto_reply_enabled, auto_post_enabled, email_notifications_enabled, last_automation_run, automation_errors')
      .eq('business_id', businessId)
      .single();

    return NextResponse.json({
      health: healthStatus,
      recentActivities: recentActivities || [],
      settings: settings || {},
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Automation status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get automation status' },
      { status: 500 }
    );
  }
}

// Handle PATCH requests for automation recovery
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, userId, action } = body;

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this business
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'retry_failed':
        // Retry failed automation tasks
        result = await errorRecoveryService.retryFailedAutomation(businessId, { userId });
        break;

      case 'clear_errors':
        // Clear automation errors
        await supabaseAdmin
          .from('business_settings')
          .update({
            automation_errors: [],
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', businessId);
        
        result = { success: true, message: 'Automation errors cleared' };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: retry_failed, clear_errors' },
          { status: 400 }
        );
    }

    // Log recovery action
    await supabaseAdmin.from('activities').insert({
      business_id: businessId,
      type: 'settings_updated',
      description: `Automation recovery action: ${action}`,
      metadata: {
        action,
        result,
        user_id: userId,
        performed_at: new Date().toISOString(),
        activity_subtype: 'automation_recovery_action',
      },
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Automation recovery API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform automation recovery' },
      { status: 500 }
    );
  }
}