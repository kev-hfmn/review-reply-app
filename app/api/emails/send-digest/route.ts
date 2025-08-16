// Send weekly digest export email API route
// POST /api/emails/send-digest

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/services/emailService';
import { DigestEmailData } from '@/types/email';

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
      recipientEmail, 
      recipientName,
      businessId,
      dateRange,
      digestData,
      pdfAttachment
    } = body;

    // Validate required fields
    if (!recipientEmail || !dateRange || !digestData) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, dateRange, digestData' },
        { status: 400 }
      );
    }

    // Verify user owns the business (if businessId provided)
    if (businessId) {
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
    }

    // Get business information
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('user_id', userId)
      .single();

    // Prepare digest email data
    const emailData: DigestEmailData = {
      userId,
      businessId,
      businessName: business?.name || 'Your Business',
      userEmail: recipientEmail,
      userName: recipientName || userName,
      dateRange,
      totalReviews: digestData.totalReviews || 0,
      averageRating: digestData.averageRating || 0,
      responseRate: digestData.responseRate || 0,
      weekOverWeekChange: {
        reviews: digestData.weekOverWeekChange?.reviews || 0,
        rating: digestData.weekOverWeekChange?.rating || 0,
        responseRate: digestData.weekOverWeekChange?.responseRate || 0
      },
      topReviews: digestData.topReviews || [],
      pdfAttachment: pdfAttachment || undefined
    };

    // Send digest email
    const emailResponse = await emailService.sendDigestEmail(emailData);

    if (!emailResponse.success) {
      console.error('Failed to send digest email:', emailResponse.error);
      return NextResponse.json(
        { 
          error: 'Failed to send digest email', 
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
          type: 'digest_email_sent',
          description: `Weekly digest emailed to ${recipientEmail}`,
          metadata: {
            recipientEmail,
            dateRange,
            messageId: emailResponse.messageId,
            totalReviews: digestData.totalReviews,
            averageRating: digestData.averageRating
          }
        });
    } catch (activityError) {
      console.error('Failed to log digest email activity:', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Digest email sent successfully',
      messageId: emailResponse.messageId,
      recipientEmail
    });

  } catch (error) {
    console.error('Error in send-digest API:', error);
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