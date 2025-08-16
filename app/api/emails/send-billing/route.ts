// Send billing notification email API route
// POST /api/emails/send-billing

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/services/emailService';
import { BillingEmailData } from '@/types/email';

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
      type,
      amount,
      currency,
      planName,
      nextBillingDate,
      invoiceUrl,
      actionRequired,
      actionMessage,
      recipientEmail,
      recipientName,
      businessId
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    // Validate billing type
    const validTypes = [
      'payment_success', 
      'payment_failed', 
      'subscription_cancelled', 
      'subscription_reactivated', 
      'plan_upgraded', 
      'plan_downgraded'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid billing type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get business information if businessId provided
    let businessName;
    if (businessId) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .eq('user_id', userId)
        .single();

      if (!businessError && business) {
        businessName = business.name;
      }
    }

    // Prepare billing email data
    const emailData: BillingEmailData = {
      userId,
      businessId,
      businessName,
      userEmail: recipientEmail || userEmail,
      userName: recipientName || userName,
      type,
      amount: amount ? parseFloat(amount) : undefined,
      currency: currency || 'USD',
      planName,
      nextBillingDate,
      invoiceUrl,
      actionRequired: !!actionRequired,
      actionMessage
    };

    // Send billing email
    const emailResponse = await emailService.sendBillingEmail(emailData);

    if (!emailResponse.success) {
      console.error('Failed to send billing email:', emailResponse.error);
      return NextResponse.json(
        { 
          error: 'Failed to send billing email', 
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
          type: 'billing_email_sent',
          description: `Billing notification sent: ${type.replace(/_/g, ' ')}`,
          metadata: {
            recipientEmail: recipientEmail || userEmail,
            billingType: type,
            amount,
            currency,
            planName,
            messageId: emailResponse.messageId,
            actionRequired: !!actionRequired
          }
        });
    } catch (activityError) {
      console.error('Failed to log billing email activity:', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: `Billing notification email sent successfully: ${type.replace(/_/g, ' ')}`,
      messageId: emailResponse.messageId,
      recipientEmail: recipientEmail || userEmail,
      billingType: type,
      amount,
      planName
    });

  } catch (error) {
    console.error('Error in send-billing API:', error);
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