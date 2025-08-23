import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { batchGenerateReplies, type ReviewData, type BatchGenerateResult } from '@/lib/services/aiReplyService';
import { errorRecoveryService } from '@/lib/services/errorRecoveryService';
import { checkUserSubscription } from '@/lib/utils/subscription';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { reviews, businessId, userId, batchSize = 5, updateDatabase = true } = body;

    // Validate required parameters
    if (!reviews || !Array.isArray(reviews)) {
      return NextResponse.json(
        { error: 'Reviews array is required' },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Validate reviews format
    for (const review of reviews) {
      if (!review.id || !review.rating || !review.text || !review.customerName) {
        return NextResponse.json(
          { error: 'Each review must have id, rating, text, and customerName' },
          { status: 400 }
        );
      }
    }

    // Declare businessInfo variable
    let businessInfo: { id: string; name: string; industry: string | null };

    // If userId is provided, verify user has access to businesses and subscription
    if (userId) {
      // Check subscription for batch AI generation first
      const subscriptionStatus = await checkUserSubscription(userId);
      if (!subscriptionStatus.isSubscriber) {
        return NextResponse.json(
          {
            error: 'Subscription required',
            message: 'Batch AI reply generation requires an active subscription.',
            code: 'SUBSCRIPTION_REQUIRED'
          },
          { status: 403 }
        );
      }

      // Get user's businesses using the same pattern as single generation (regenerateReply)
      const { data: userBusinesses, error: businessError } = await supabaseAdmin
        .from('businesses')
        .select('id, name, industry')
        .eq('user_id', userId);

      if (businessError) {
        return NextResponse.json(
          { error: 'Failed to fetch user businesses' },
          { status: 500 }
        );
      }

      if (!userBusinesses || userBusinesses.length === 0) {
        return NextResponse.json(
          { error: 'No businesses found for user' },
          { status: 404 }
        );
      }

      // Verify the requested businessId belongs to the user
      const userBusiness = userBusinesses.find(b => b.id === businessId);
      if (!userBusiness) {
        return NextResponse.json(
          { error: 'Business not found or access denied' },
          { status: 404 }
        );
      }

      // Use the validated business info
      businessInfo = userBusiness;
    } else {
      // If no userId provided, verify business exists (for backward compatibility)
      const { data: business, error: businessInfoError } = await supabaseAdmin
        .from('businesses')
        .select('id, name, industry')
        .eq('id', businessId)
        .single();

      if (businessInfoError || !business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }

      businessInfo = business;
    }

    // Check business settings to ensure AI reply generation is enabled
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('auto_reply_enabled, brand_voice_preset, formality_level, warmth_level, brevity_level, custom_instruction')
      .eq('business_id', businessInfo.id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Business settings not found' },
        { status: 404 }
      );
    }

    // Log bulk generation start
    await supabaseAdmin.from('activities').insert({
      business_id: businessId,
      type: 'ai_reply_generated',
      description: `Starting bulk AI reply generation for ${reviews.length} reviews`,
      metadata: {
        review_count: reviews.length,
        batch_size: batchSize,
        update_database: updateDatabase,
        api_endpoint: '/api/ai/generate-bulk-replies',
        started_at: new Date().toISOString(),
        activity_subtype: 'bulk_generation_start',
      },
    });

    // Convert reviews to ReviewData format
    const reviewData: ReviewData[] = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      customerName: review.customerName,
    }));

    // Create brand voice settings from database settings
    const brandVoice = {
      preset: settings.brand_voice_preset as 'friendly' | 'professional' | 'playful' | 'custom',
      formality: settings.formality_level,
      warmth: settings.warmth_level,
      brevity: settings.brevity_level,
      customInstruction: settings.custom_instruction,
    };

    // Create business info from validated business data
    const businessInfoForGeneration = {
      name: businessInfo.name,
      industry: businessInfo.industry || 'service',
    };

    // Generate AI replies in batches
    const result: BatchGenerateResult = await batchGenerateReplies(
      reviewData,
      businessId,
      batchSize,
      brandVoice,
      businessInfoForGeneration
    );

    // Update database with results if requested
    if (updateDatabase) {
      const updatePromises = result.results.map(async (reviewResult) => {
        if (reviewResult.success && reviewResult.reply) {
          // Update review with AI reply
          return supabaseAdmin
            .from('reviews')
            .update({
              ai_reply: reviewResult.reply,
              automated_reply: true,
              automation_failed: false,
              automation_error: null,
              reply_tone: settings.brand_voice_preset,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reviewResult.reviewId);
        } else {
          // Mark as failed
          return supabaseAdmin
            .from('reviews')
            .update({
              automation_failed: true,
              automation_error: reviewResult.error || 'Failed to generate AI reply',
              updated_at: new Date().toISOString(),
            })
            .eq('id', reviewResult.reviewId);
        }
      });

      // Wait for all database updates to complete
      const updateResults = await Promise.allSettled(updatePromises);
      const failedUpdates = updateResults.filter(r => r.status === 'rejected').length;

      if (failedUpdates > 0) {
        console.warn(`${failedUpdates} database updates failed during bulk generation`);
      }
    }

    // Log completion
    await supabaseAdmin.from('activities').insert({
      business_id: businessId,
      type: 'ai_reply_generated',
      description: `Bulk AI reply generation completed: ${result.successCount}/${reviews.length} successful`,
      metadata: {
        total_reviews: reviews.length,
        successful_replies: result.successCount,
        failed_replies: result.failureCount,
        error_count: result.errors.length,
        batch_size: batchSize,
        update_database: updateDatabase,
        completed_at: new Date().toISOString(),
        activity_subtype: 'bulk_generation_complete',
      },
    });

    // Log individual errors if any
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        await errorRecoveryService.handleAutomationFailure(error, {
          businessId,
          userId,
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: result.successCount > 0,
      totalReviews: reviews.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      results: result.results,
      errors: result.errors,
      databaseUpdated: updateDatabase,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Bulk AI reply generation error:', error);

    // Handle the error using error recovery service
    await errorRecoveryService.handleAutomationFailure({
      step: 'bulk_ai_generation_api',
      error: error instanceof Error ? error.message : 'Unknown bulk generation error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        error: 'Internal server error during bulk AI reply generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for bulk generation status/history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // If userId is provided, verify user has access to this business
    if (userId) {
      // Get user's businesses using the same pattern as POST handler
      const { data: userBusinesses, error: businessError } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('user_id', userId);

      if (businessError) {
        return NextResponse.json(
          { error: 'Failed to fetch user businesses' },
          { status: 500 }
        );
      }

      if (!userBusinesses || userBusinesses.length === 0) {
        return NextResponse.json(
          { error: 'No businesses found for user' },
          { status: 404 }
        );
      }

      // Verify the requested businessId belongs to the user
      const userBusiness = userBusinesses.find(b => b.id === businessId);
      if (!userBusiness) {
        return NextResponse.json(
          { error: 'Business not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Get recent bulk generation activities
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('business_id', businessId)
      .eq('type', 'ai_reply_generated')
      .contains('metadata', { activity_subtype: 'bulk_generation_complete' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activitiesError) {
      return NextResponse.json(
        { error: `Failed to fetch bulk generation history: ${activitiesError.message}` },
        { status: 500 }
      );
    }

    // Get current automation status
    const { data: pendingReviews, error: pendingError } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, automated_reply')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .is('ai_reply', null);

    if (pendingError) {
      console.warn('Failed to fetch pending reviews:', pendingError);
    }

    // Get recent automation errors
    const { data: recentErrors, error: errorsError } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, automation_error, updated_at')
      .eq('business_id', businessId)
      .eq('automation_failed', true)
      .not('automation_error', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (errorsError) {
      console.warn('Failed to fetch recent errors:', errorsError);
    }

    return NextResponse.json({
      recentGenerations: activities || [],
      pendingReviews: pendingReviews || [],
      recentErrors: recentErrors || [],
      statistics: {
        pendingCount: pendingReviews?.length || 0,
        errorCount: recentErrors?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Bulk generation status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get bulk generation status' },
      { status: 500 }
    );
  }
}