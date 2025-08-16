// Send review notification email API route
// POST /api/emails/send-review-notification

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/services/emailService';
import { ReviewNotificationData } from '@/types/email';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with user session
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email!;
    const userName = session.user.user_metadata?.full_name || session.user.email!.split('@')[0];

    // Parse request body
    const body = await request.json();
    const { 
      businessId,
      reviewIds,
      recipientEmail,
      recipientName
    } = body;

    // Validate required fields
    if (!businessId || (!reviewIds || reviewIds.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId, reviewIds' },
        { status: 400 }
      );
    }

    // Verify user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 403 }
      );
    }

    // Fetch review details
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        google_review_id,
        customer_name,
        rating,
        review_text,
        review_date,
        status,
        ai_reply,
        final_reply
      `)
      .eq('business_id', businessId)
      .in('id', reviewIds)
      .order('review_date', { ascending: false });

    if (reviewsError || !reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: 'No reviews found or access denied' },
        { status: 404 }
      );
    }

    // Calculate average rating for new reviews
    const averageNewRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Prepare review notification data
    const emailData: ReviewNotificationData = {
      userId,
      businessId,
      businessName: business.name,
      userEmail: recipientEmail || userEmail,
      userName: recipientName || userName,
      reviews: reviews.map(review => ({
        id: review.id,
        googleReviewId: review.google_review_id,
        customerName: review.customer_name,
        rating: review.rating,
        text: review.review_text,
        reviewDate: review.review_date,
        requiresReply: !review.ai_reply && !review.final_reply && review.status === 'pending'
      })),
      totalNewReviews: reviews.length,
      averageNewRating
    };

    // Send review notification email
    const emailResponse = await emailService.sendReviewNotification(emailData);

    if (!emailResponse.success) {
      console.error('Failed to send review notification email:', emailResponse.error);
      return NextResponse.json(
        { 
          error: 'Failed to send review notification email', 
          details: emailResponse.error 
        },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await supabase
        .from('activities')
        .insert({
          business_id: businessId,
          type: 'review_notification_sent',
          description: `Review notification emailed: ${reviews.length} new review${reviews.length > 1 ? 's' : ''}`,
          metadata: {
            recipientEmail: recipientEmail || userEmail,
            reviewCount: reviews.length,
            averageRating: averageNewRating,
            messageId: emailResponse.messageId,
            reviewIds
          }
        });
    } catch (activityError) {
      console.error('Failed to log review notification activity:', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Review notification email sent successfully',
      messageId: emailResponse.messageId,
      recipientEmail: recipientEmail || userEmail,
      reviewCount: reviews.length,
      averageRating: averageNewRating
    });

  } catch (error) {
    console.error('Error in send-review-notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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