// Automation Summary Email API Route
// POST /api/email/automation-summary
// Called by automationService.ts when replies are auto-posted during daily sync

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { emailService } from '@/lib/services/emailService';
import { AutomationSummaryData } from '@/types/email';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Automation summary email API called');

    // Parse request body - matches exactly what automationService.ts sends
    const body = await request.json();
    const { 
      businessId, 
      userId, 
      newReviews,           // Number of new reviews found
      postedReplies,        // Number of replies actually posted  
      slotId,               // 'slot_1' or 'slot_2'
      approvalMode,         // Current approval mode setting
      automationResult      // Metrics from automation pipeline
    } = body;

    console.log('📊 Email request data:', { 
      businessId: businessId?.substring(0, 8) + '...', 
      userId: userId?.substring(0, 8) + '...', 
      newReviews, 
      postedReplies, 
      slotId,
      approvalMode,
      postedReviewsCount: body.postedReviews?.length || 0,
      pendingReviewsCount: body.pendingReviews?.length || 0
    });

    // CRITICAL: Only send email if replies were posted OR there are pending reviews
    const pendingReviewsCount = body.pendingReviews?.length || 0;
    if ((!postedReplies || postedReplies === 0) && pendingReviewsCount === 0) {
      console.log('⏭️ No replies posted and no pending reviews, skipping email');
      return NextResponse.json({
        success: true,
        message: 'No replies posted and no pending reviews, no email sent',
        postedReplies: 0,
        pendingReviews: 0,
        emailSent: false
      });
    }

    // Validate required fields
    if (!businessId || !userId || !slotId) {
      return NextResponse.json({
        error: 'Missing required fields: businessId, userId, slotId'
      }, { status: 400 });
    }

    // Use admin client for server-to-server calls from Edge Function
    const supabase = supabaseAdmin;
    
    // Get business details and verify ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, user_id')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      console.error('❌ Business not found:', businessError);
      return NextResponse.json({
        error: 'Business not found or access denied'
      }, { status: 404 });
    }

    // Get user details - we need email from auth.users
    const { data: userResponse, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userResponse.user) {
      console.error('❌ User not found:', userError);
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const user = userResponse.user;

    // Check if email notifications are enabled for this business
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('email_notifications_enabled, auto_post_enabled')
      .eq('business_id', businessId)
      .single();

    if (settingsError) {
      console.error('❌ Settings not found:', settingsError);
      return NextResponse.json({
        error: 'Business settings not found'
      }, { status: 404 });
    }

    // Check if email notifications are enabled
    if (!settings?.email_notifications_enabled) {
      console.log('📪 Email notifications disabled for this business');
      return NextResponse.json({
        success: true,
        message: 'Email notifications disabled for this business',
        emailSent: false
      });
    }

    // Check if auto-posting is enabled (required for automation emails)
    if (!settings?.auto_post_enabled) {
      console.log('📪 Auto-posting disabled, no automation email sent');
      return NextResponse.json({
        success: true,
        message: 'Auto-posting disabled, no automation email needed',
        emailSent: false
      });
    }

    console.log('✅ All checks passed, preparing email data');

    // Prepare automation summary data
    const emailData: AutomationSummaryData = {
      userId,
      businessId,
      businessName: business.name,
      userEmail: user.email!,
      userName: user.user_metadata?.full_name || user.email!.split('@')[0],
      slotId,
      automationMetrics: automationResult,
      newReviewsCount: newReviews || 0,
      postedRepliesCount: postedReplies,
      triggerType: 'scheduled',
      syncTimestamp: new Date().toISOString(),
      approvalMode: approvalMode || 'manual',
      postedReviews: body.postedReviews || [],
      pendingReviewsCount: pendingReviewsCount,
      pendingReviews: body.pendingReviews || []
    };

    console.log('📤 Sending automation summary email to:', user.email);

    // Send automation summary email
    const emailResponse = await emailService.sendAutomationSummary(emailData);

    if (!emailResponse.success) {
      console.error('❌ Failed to send automation summary email:', emailResponse.error);
      return NextResponse.json({
        error: 'Failed to send automation summary email',
        details: emailResponse.error
      }, { status: 500 });
    }

    console.log('✅ Email sent successfully, messageId:', emailResponse.messageId);

    // Log activity to database
    try {
      await supabase.from('activities').insert({
        business_id: businessId,
        type: 'email_notification_sent',
        description: `🤖 Automation summary emailed: ${postedReplies} replies posted`,
        metadata: {
          slotId,
          postedReplies,
          newReviews: newReviews || 0,
          messageId: emailResponse.messageId,
          automationMetrics: automationResult,
          triggerType: 'scheduled',
          emailType: 'automation_summary',
          recipient: user.email
        }
      });
      console.log('📝 Activity logged to database');
    } catch (activityError) {
      console.error('⚠️ Failed to log activity (non-critical):', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Automation summary email sent successfully',
      messageId: emailResponse.messageId,
      postedReplies,
      recipient: user.email,
      businessName: business.name,
      emailSent: true
    });

  } catch (error) {
    console.error('💥 Critical error in automation-summary API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}