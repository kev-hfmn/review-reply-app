import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { AutoApprovalService, type ApprovalMode } from '@/lib/services/autoApprovalService';
import { errorRecoveryService } from '@/lib/services/errorRecoveryService';
import { checkUserSubscription, hasFeature } from '@/lib/utils/subscription';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { businessId, userId, reviewIds, approvalMode, previewOnly = false } = body;

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

    // Check subscription status for auto-approval feature
    const subscriptionStatus = await checkUserSubscription(userId);
    if (!hasFeature(subscriptionStatus.planId, 'autoApproval')) {
      return NextResponse.json(
        {
          error: 'Auto-approval not available',
          message: 'Auto-approval requires a Pro plan or higher.',
          requiredPlan: 'pro',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      );
    }

    // Verify user has access to this business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Get business settings
    const { data: settings, error: settingsError } = await supabase
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

    // Use provided approval mode or fall back to business settings
    const effectiveApprovalMode = approvalMode || settings.approval_mode;

    // Validate approval mode
    if (!['manual', 'auto_4_plus', 'auto_except_low'].includes(effectiveApprovalMode)) {
      return NextResponse.json(
        { error: 'Invalid approval mode' },
        { status: 400 }
      );
    }

    const autoApprovalService = new AutoApprovalService();

    // If this is a preview request, return what would happen
    if (previewOnly) {
      const preview = await autoApprovalService.previewAutoApproval(
        businessId, 
        effectiveApprovalMode as ApprovalMode
      );

      return NextResponse.json({
        preview: true,
        approvalMode: effectiveApprovalMode,
        wouldApprove: preview.wouldApprove,
        wouldSkip: preview.wouldSkip,
        byRating: preview.byRating,
        timestamp: new Date().toISOString(),
      });
    }

    // If specific review IDs are provided, process those
    if (reviewIds && Array.isArray(reviewIds)) {
      const batchResult = await autoApprovalService.batchApproveReviews(
        reviewIds,
        {
          mode: effectiveApprovalMode as ApprovalMode,
          businessId,
          settings,
        }
      );

      // Log batch approval
      await supabase.from('activities').insert({
        business_id: businessId,
        type: 'reply_auto_approved',
        description: `Batch auto-approval completed: ${batchResult.approvedCount}/${reviewIds.length} approved`,
        metadata: {
          approval_mode: effectiveApprovalMode,
          total_reviews: reviewIds.length,
          approved_count: batchResult.approvedCount,
          error_count: batchResult.errors.length,
          review_ids: reviewIds,
          api_endpoint: '/api/reviews/auto-approve',
          completed_at: new Date().toISOString(),
          activity_subtype: 'batch_auto_approval',
        },
      });

      return NextResponse.json({
        success: batchResult.approvedCount > 0,
        approvalMode: effectiveApprovalMode,
        totalReviews: reviewIds.length,
        approvedCount: batchResult.approvedCount,
        errors: batchResult.errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise, process all eligible reviews for auto-approval
    const eligibleReviews = await autoApprovalService.getEligibleReviews(
      businessId, 
      effectiveApprovalMode as ApprovalMode
    );

    if (eligibleReviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reviews are eligible for auto-approval',
        approvalMode: effectiveApprovalMode,
        totalReviews: 0,
        approvedCount: 0,
        errors: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Process auto-approval for all eligible reviews
    const eligibleReviewIds = eligibleReviews.map(r => r.id);
    const batchResult = await autoApprovalService.batchApproveReviews(
      eligibleReviewIds,
      {
        mode: effectiveApprovalMode as ApprovalMode,
        businessId,
        settings,
      }
    );

    // Log auto-approval completion
    await supabase.from('activities').insert({
      business_id: businessId,
      type: 'reply_auto_approved',
      description: `Auto-approval processing completed: ${batchResult.approvedCount}/${eligibleReviews.length} approved`,
      metadata: {
        approval_mode: effectiveApprovalMode,
        eligible_reviews: eligibleReviews.length,
        approved_count: batchResult.approvedCount,
        error_count: batchResult.errors.length,
        api_endpoint: '/api/reviews/auto-approve',
        completed_at: new Date().toISOString(),
        activity_subtype: 'auto_approval_processing',
      },
    });

    // Log any errors
    if (batchResult.errors.length > 0) {
      for (const error of batchResult.errors) {
        await errorRecoveryService.handleAutomationFailure({
          step: 'auto_approval',
          error,
          timestamp: new Date().toISOString(),
          businessId,
        }, { businessId, userId });
      }
    }

    return NextResponse.json({
      success: batchResult.approvedCount > 0,
      approvalMode: effectiveApprovalMode,
      eligibleReviews: eligibleReviews.length,
      approvedCount: batchResult.approvedCount,
      errors: batchResult.errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Auto-approval API error:', error);

    // Handle the error using error recovery service
    await errorRecoveryService.handleAutomationFailure({
      step: 'auto_approval_api',
      error: error instanceof Error ? error.message : 'Unknown auto-approval error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        error: 'Internal server error during auto-approval processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for auto-approval status and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

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

    // Check subscription status for auto-approval feature
    const subscriptionStatus = await checkUserSubscription(userId);
    if (!hasFeature(subscriptionStatus.planId, 'autoApproval')) {
      return NextResponse.json(
        {
          error: 'Auto-approval not available',
          message: 'Auto-approval requires a Pro plan or higher.',
          requiredPlan: 'pro',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      );
    }

    // Verify user has access to this business
    const { data: business, error: businessError } = await supabase
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

    const autoApprovalService = new AutoApprovalService();

    // Get approval statistics
    const approvalStats = await autoApprovalService.getApprovalStats(businessId, days);

    // Get current business approval settings
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('approval_mode')
      .eq('business_id', businessId)
      .single();

    if (settingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch business settings' },
        { status: 500 }
      );
    }

    // Get eligible reviews for current mode
    const eligibleReviews = await autoApprovalService.getEligibleReviews(
      businessId, 
      settings?.approval_mode || 'manual'
    );

    // Get preview of what would happen with auto-approval
    const preview = await autoApprovalService.previewAutoApproval(
      businessId, 
      settings?.approval_mode || 'manual'
    );

    // Get recent auto-approval activities
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('business_id', businessId)
      .eq('type', 'reply_auto_approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.warn('Failed to fetch recent activities:', activitiesError);
    }

    return NextResponse.json({
      approvalMode: settings?.approval_mode || 'manual',
      statistics: approvalStats,
      eligibleReviews: eligibleReviews.length,
      preview,
      recentActivities: recentActivities || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Auto-approval status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get auto-approval status' },
      { status: 500 }
    );
  }
}

// Handle PATCH requests for updating approval mode
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, userId, approvalMode } = body;

    if (!businessId || !userId || !approvalMode) {
      return NextResponse.json(
        { error: 'Business ID, User ID, and approval mode are required' },
        { status: 400 }
      );
    }

    // Validate approval mode
    if (!['manual', 'auto_4_plus', 'auto_except_low'].includes(approvalMode)) {
      return NextResponse.json(
        { error: 'Invalid approval mode. Must be: manual, auto_4_plus, or auto_except_low' },
        { status: 400 }
      );
    }

    // Verify user has access to this business
    const { data: business, error: businessError } = await supabase
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

    const autoApprovalService = new AutoApprovalService();

    // Update approval mode
    await autoApprovalService.updateApprovalMode(businessId, approvalMode as ApprovalMode);

    // Get preview of what would happen with new mode
    const preview = await autoApprovalService.previewAutoApproval(
      businessId, 
      approvalMode as ApprovalMode
    );

    return NextResponse.json({
      success: true,
      approvalMode,
      preview,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Update approval mode API error:', error);
    return NextResponse.json(
      { error: 'Failed to update approval mode' },
      { status: 500 }
    );
  }
}