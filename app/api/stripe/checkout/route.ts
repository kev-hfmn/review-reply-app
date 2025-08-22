import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user email from Supabase
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the site URL from environment
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!siteUrl) {
      console.error('Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Creating checkout session with:', {
      priceId,
      userId,
      userEmail: user.user.email,
      siteUrl
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/profile?payment=success`,
      cancel_url: `${siteUrl}/profile?payment=cancelled`,
      client_reference_id: userId, // This is important for webhook handling
      metadata: {
        userId: userId,
      },
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      url: session.url
    });

    if (!session.url) {
      console.error('Stripe session created but no URL returned:', session);
      return NextResponse.json(
        { error: 'Checkout session created but no URL available' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
