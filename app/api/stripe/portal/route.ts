import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { withCors } from '@/utils/cors';
import { supabaseAdmin } from '@/utils/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = withCors(async function POST(request: NextRequest) {
  try {
    const { customerId, userId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Create a portal session for the customer
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile`,
    });

    // Track portal session creation in database for audit trail
    if (userId) {
      try {
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            portal_session_id: portalSession.id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)
          .eq('status', 'active');

        console.log(`Portal session ${portalSession.id} created for customer ${customerId}`);
      } catch (dbError) {
        console.warn('Failed to track portal session in database:', dbError);
        // Don't fail the request if we can't track it
      }
    }

    return NextResponse.json({ 
      url: portalSession.url,
      sessionId: portalSession.id 
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
});
