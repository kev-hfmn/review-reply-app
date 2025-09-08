import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
  businessName: string;
  email: string;
  message: string;
  turnstileToken: string;
}

interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const { businessName, email, message, turnstileToken } = body;

    // Validate required fields
    if (!businessName?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify Turnstile token with Cloudflare (only if keys are configured)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const shouldVerifyTurnstile = turnstileSecret && turnstileSiteKey;
    
    if (shouldVerifyTurnstile && !turnstileToken) {
      return NextResponse.json(
        { error: 'CAPTCHA verification is required' },
        { status: 400 }
      );
    }

    // Only perform Turnstile verification if keys are configured
    if (shouldVerifyTurnstile && turnstileToken) {
      const turnstileFormData = new FormData();
      turnstileFormData.append('secret', turnstileSecret);
      turnstileFormData.append('response', turnstileToken);
      
      // Get client IP for additional verification
      const clientIp = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       '127.0.0.1';
      turnstileFormData.append('remoteip', clientIp);

      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: turnstileFormData,
      });

      const turnstileResult: TurnstileVerificationResponse = await turnstileResponse.json();

      if (!turnstileResult.success) {
        console.error('Turnstile verification failed:', turnstileResult['error-codes']);
        return NextResponse.json(
          { error: 'CAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Get client IP for logging
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Forward to Make.com webhook if Turnstile verification passes
    const makeResponse = await fetch('https://hook.eu2.make.com/knv29vbyny2wdm0zwv4wv14p4wyjg4gw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName,
        email,
        message,
        verifiedAt: new Date().toISOString(),
        clientIp: clientIp.split(',')[0].trim(), // Take first IP if multiple
        captchaEnabled: shouldVerifyTurnstile,
      }),
    });

    if (!makeResponse.ok) {
      console.error('Make.com webhook failed:', makeResponse.status, makeResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to process form submission. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Form submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
