import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { postReplyToGoogle } from '@/lib/services/googleBusinessService';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Post reply to Google Business Profile review
 * POST /api/reviews/post-reply
 */
export async function POST(request: NextRequest) {
  try {
    const { reviewId, userId, replyText } = await request.json();

    // Basic validation - EXACT same pattern as sync route
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

    // Get the review and verify ownership - EXACT same pattern as other API routes
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

    // Verify user owns this business - EXACT same pattern as other API routes
    if ((review.businesses as any).user_id !== userId) {
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

    // Check if review is already posted
    if (review.status === 'posted') {
      return NextResponse.json(
        { error: 'Reply has already been posted to this review' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting reply posting for review ${reviewId}, user ${userId}`);

    // Post reply to Google Business Profile - using our proven service function
    const googleResult = await postReplyToGoogle(
      review.business_id,
      review.google_review_id,
      replyText
    );

    if (!googleResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to post reply to Google Business Profile',
          details: googleResult.message,
          code: googleResult.error
        },
        { status: 400 }
      );
    }

    // Only update database AFTER successful Google posting - EXACT same pattern as other operations
    const postedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        status: 'posted',
        posted_at: postedAt,
        final_reply: replyText,
        updated_at: postedAt
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Failed to update review status after successful Google posting:', updateError);
      // Note: Reply was posted to Google successfully, but DB update failed
      return NextResponse.json(
        { 
          error: 'Reply posted to Google but failed to update local database',
          details: updateError.message,
          postedAt
        },
        { status: 500 }
      );
    }

    // Add activity log - EXACT same pattern as other operations
    await supabaseAdmin
      .from('activities')
      .insert({
        business_id: review.business_id,
        type: 'reply_posted',
        description: `Reply posted to ${review.rating}-star review from ${review.customer_name}`,
        metadata: { 
          review_id: reviewId, 
          rating: review.rating,
          google_review_id: review.google_review_id
        }
      });

    console.log(`✅ Reply posted successfully for review ${reviewId}`);

    return NextResponse.json({
      success: true,
      message: 'Reply posted successfully to Google Business Profile',
      postedAt
    });

  } catch (error) {
    console.error('Reply posting API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
