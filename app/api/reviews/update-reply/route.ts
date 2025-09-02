import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateReplyToGoogle } from '@/lib/services/googleBusinessService';
import { checkUserSubscription, checkReplyLimit, incrementReplyCount } from '@/lib/utils/subscription';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Update existing reply on Google Business Profile review
 * PUT /api/reviews/update-reply
 */
export async function PUT(request: NextRequest) {
  try {
    const { reviewId, userId, replyText } = await request.json();

    // Basic validation - EXACT same pattern as post-reply route
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    if (!reviewId || !replyText) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewId and replyText are required' },
        { status: 400 }
      );
    }

    // Get the review and verify ownership - EXACT same pattern as post-reply route
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        business_id,
        google_review_id,
        customer_name,
        rating,
        status,
        final_reply,
        ai_reply,
        businesses!inner (
          id,
          user_id
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify user owns this business - EXACT same pattern as post-reply route
    if ((review.businesses as unknown as { user_id: string }).user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this business' },
        { status: 403 }
      );
    }

    // Check if review has Google Review ID
    if (!review.google_review_id) {
      return NextResponse.json(
        { error: 'Review does not have a Google Review ID and cannot be replied to' },
        { status: 400 }
      );
    }

    // Check if review is already posted (required for updating)
    if (review.status !== 'posted') {
      return NextResponse.json(
        { error: 'Reply must be posted before it can be updated. Current status: ' + review.status },
        { status: 400 }
      );
    }

    // Check if the new reply text is different from the current one
    if (review.final_reply === replyText) {
      return NextResponse.json(
        { error: 'New reply text is identical to the current reply' },
        { status: 400 }
      );
    }

    // Check subscription status and reply limits (same as posting new replies)
    const subscriptionStatus = await checkUserSubscription(userId);
    
    if (!subscriptionStatus.isSubscriber) {
      return NextResponse.json(
        { 
          error: 'Subscription required',
          message: 'Updating replies requires an active subscription. Please upgrade your plan.',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }

    // Note: We don't increment reply count for updates since it's modifying existing content
    // But we still check limits to prevent abuse
    const replyLimitCheck = await checkReplyLimit(userId, review.business_id, subscriptionStatus.planId);
    
    if (!replyLimitCheck.canPost) {
      return NextResponse.json(
        { 
          error: 'Reply limit exceeded',
          message: 'You have reached your monthly limit and cannot update replies at this time.',
          code: 'REPLY_LIMIT_EXCEEDED',
          currentUsage: replyLimitCheck.currentUsage,
          limit: replyLimitCheck.limit
        },
        { status: 403 }
      );
    }

    console.log(`🚀 Starting reply update for review ${reviewId}, user ${userId}`);

    // Update reply on Google Business Profile using our new service function
    const googleResult = await updateReplyToGoogle(
      review.business_id,
      review.google_review_id,
      replyText
    );

    if (!googleResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to update reply on Google Business Profile',
          details: googleResult.message,
          code: googleResult.error
        },
        { status: 400 }
      );
    }

    // Only update database AFTER successful Google update - EXACT same pattern as post-reply
    const updatedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        final_reply: replyText,
        updated_at: updatedAt
        // Keep status as 'posted' since it's still posted, just updated
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Failed to update review in database after successful Google update:', updateError);
      // Note: Reply was updated on Google successfully, but DB update failed
      return NextResponse.json(
        { 
          error: 'Reply updated on Google but failed to update local database',
          details: updateError.message,
          updatedAt
        },
        { status: 500 }
      );
    }

    // Add activity log - Track reply updates
    await supabaseAdmin
      .from('activities')
      .insert({
        business_id: review.business_id,
        type: 'reply_updated',
        description: `Reply updated for ${review.rating}-star review from ${review.customer_name}`,
        metadata: { 
          review_id: reviewId, 
          rating: review.rating,
          google_review_id: review.google_review_id,
          previous_reply: review.final_reply,
          new_reply: replyText
        }
      });

    console.log(`✅ Reply updated successfully for review ${reviewId}`);

    return NextResponse.json({
      success: true,
      message: 'Reply updated successfully on Google Business Profile',
      updatedAt
    });

  } catch (error) {
    console.error('Reply update API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}