// Send system alert email API route
// POST /api/emails/send-system-alert

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/services/emailService';
import { SystemAlertData } from '@/types/email';

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
      alertType,
      title,
      message,
      errorDetails,
      actionRequired,
      actionUrl,
      actionButtonText,
      severity,
      recipientEmail,
      recipientName,
      businessId
    } = body;

    // Validate required fields
    if (!alertType || !title || !message || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: alertType, title, message, severity' },
        { status: 400 }
      );
    }

    // Validate alert type
    const validAlertTypes = [
      'google_integration_failure',
      'sync_failure', 
      'api_quota_exceeded',
      'credential_expired',
      'general_error'
    ];

    if (!validAlertTypes.includes(alertType)) {
      return NextResponse.json(
        { error: `Invalid alert type. Must be one of: ${validAlertTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
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

    // Prepare system alert email data
    const emailData: SystemAlertData = {
      userId,
      businessId,
      businessName,
      userEmail: recipientEmail || userEmail,
      userName: recipientName || userName,
      alertType,
      title,
      message,
      errorDetails,
      actionRequired: !!actionRequired,
      actionUrl,
      actionButtonText,
      severity
    };

    // Send system alert email
    const emailResponse = await emailService.sendSystemAlert(emailData);

    if (!emailResponse.success) {
      console.error('Failed to send system alert email:', emailResponse.error);
      return NextResponse.json(
        { 
          error: 'Failed to send system alert email', 
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
          type: 'system_alert_sent',
          description: `System alert sent: ${title}`,
          metadata: {
            recipientEmail: recipientEmail || userEmail,
            alertType,
            title,
            message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
            severity,
            actionRequired: !!actionRequired,
            messageId: emailResponse.messageId
          }
        });
    } catch (activityError) {
      console.error('Failed to log system alert activity:', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: `System alert email sent successfully: ${title}`,
      messageId: emailResponse.messageId,
      recipientEmail: recipientEmail || userEmail,
      alertType,
      severity,
      actionRequired: !!actionRequired
    });

  } catch (error) {
    console.error('Error in send-system-alert API:', error);
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