// Send reply confirmation email API route
// POST /api/emails/send-reply-confirmation

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/services/emailService';
import { ReplyConfirmationData } from '@/types/email';

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
      reviewId,
      businessId,
      recipientEmail,
      recipientName,
      businessProfileUrl
    } = body;

    // Validate required fields
    if (!reviewId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewId, businessId' },
        { status: 400 }
      );
    }

    // Verify user owns the business and review
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        id,
        customer_name,
        rating,
        review_text,
        final_reply,
        posted_at,
        businesses!inner(
          id,
          name,
          user_id,
          google_business_id
        )
      `)
      .eq('id', reviewId)
      .eq('business_id', businessId)
      .eq('businesses.user_id', userId)
      .single();

    if (reviewError || !reviewData) {
      return NextResponse.json(
        { error: 'Review not found or access denied' },
        { status: 404 }
      );
    }

    // Check if reply was actually posted
    if (!reviewData.final_reply || !reviewData.posted_at) {
      return NextResponse.json(
        { error: 'Reply has not been posted yet' },
        { status: 400 }
      );
    }

    // Generate business profile URL if not provided
    let profileUrl = businessProfileUrl;
    if (!profileUrl && reviewData.businesses.google_business_id) {
      // Construct Google Business Profile URL
      profileUrl = `https://business.google.com/reviews?hl=en&gmbsrc=ww-ww-et-gs-z-gmb-l-z-h~z-ogb-u&utm_source=gmb&utm_medium=referral`;
    }

    // Prepare reply confirmation email data
    const emailData: ReplyConfirmationData = {
      userId,
      businessId,
      businessName: reviewData.businesses.name,
      userEmail: recipientEmail || userEmail,
      userName: recipientName || userName,
      review: {
        id: reviewData.id,
        customerName: reviewData.customer_name,
        rating: reviewData.rating,
        reviewText: reviewData.review_text,
        replyText: reviewData.final_reply,
        postedAt: reviewData.posted_at
      },
      businessProfileUrl: profileUrl
    };

    // Send reply confirmation email
    const emailResponse = await emailService.sendReplyConfirmation(emailData);

    if (!emailResponse.success) {
      console.error('Failed to send reply confirmation email:', emailResponse.error);
      return NextResponse.json(
        { 
          error: 'Failed to send reply confirmation email', 
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
          type: 'reply_confirmation_sent',
          description: `Reply confirmation emailed for ${reviewData.rating}-star review from ${reviewData.customer_name}`,
          metadata: {
            recipientEmail: recipientEmail || userEmail,
            reviewId: reviewData.id,
            customerName: reviewData.customer_name,
            rating: reviewData.rating,
            messageId: emailResponse.messageId,
            replyText: reviewData.final_reply.substring(0, 100) + (reviewData.final_reply.length > 100 ? '...' : '')
          }
        });
    } catch (activityError) {
      console.error('Failed to log reply confirmation activity:', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Reply confirmation email sent successfully',
      messageId: emailResponse.messageId,
      recipientEmail: recipientEmail || userEmail,
      review: {
        customerName: reviewData.customer_name,
        rating: reviewData.rating,
        postedAt: reviewData.posted_at
      }
    });

  } catch (error) {
    console.error('Error in send-reply-confirmation API:', error);
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