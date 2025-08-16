// Test email configuration API route
// POST /api/emails/test

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/services/emailService';

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

    const userEmail = session.user.email!;

    // Parse request body
    const body = await request.json();
    const { testEmail } = body;

    // Use provided test email or default to user's email
    const recipientEmail = testEmail || userEmail;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing email configuration with recipient:', recipientEmail);

    // Test email configuration
    const emailResponse = await emailService.testEmailConfiguration(recipientEmail);

    if (!emailResponse.success) {
      console.error('❌ Email test failed:', emailResponse.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Email test failed', 
          details: emailResponse.error 
        },
        { status: 500 }
      );
    }

    console.log('✅ Email test successful:', emailResponse.messageId);

    // Log test activity
    try {
      await supabase
        .from('activities')
        .insert({
          type: 'email_test_sent',
          description: `Email configuration test sent to ${recipientEmail}`,
          metadata: {
            testEmail: recipientEmail,
            messageId: emailResponse.messageId,
            testType: 'configuration_test'
          }
        });
    } catch (activityError) {
      console.error('Failed to log email test activity:', activityError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: emailResponse.messageId,
      recipientEmail,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in email test API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET handler for configuration check
export async function GET() {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = ['BREVO_API_KEY'];
    const optionalEnvVars = [
      'BREVO_SENDER_EMAIL',
      'BREVO_SENDER_NAME',
      'BREVO_REPLY_TO_EMAIL',
      'BREVO_REPLY_TO_NAME'
    ];

    const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
    const presentOptional = optionalEnvVars.filter(envVar => !!process.env[envVar]);

    if (missingRequired.length > 0) {
      return NextResponse.json({
        configured: false,
        error: `Missing required environment variables: ${missingRequired.join(', ')}`,
        required: requiredEnvVars,
        optional: optionalEnvVars
      });
    }

    return NextResponse.json({
      configured: true,
      message: 'Brevo email configuration is valid',
      config: {
        senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@replifast.com',
        senderName: process.env.BREVO_SENDER_NAME || 'RepliFast',
        hasReplyTo: !!process.env.BREVO_REPLY_TO_EMAIL,
        optionalConfigured: presentOptional
      }
    });

  } catch (error) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: 'Failed to check email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}