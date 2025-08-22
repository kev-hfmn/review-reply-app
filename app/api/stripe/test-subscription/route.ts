import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    console.log('Testing subscription creation...');
    
    // Get the latest checkout session from Stripe
    const sessions = await stripe.checkout.sessions.list({
      limit: 1,
      expand: ['data.subscription']
    });
    
    const session = sessions.data[0];
    if (!session) {
      return NextResponse.json({ error: 'No sessions found' }, { status: 404 });
    }
    
    console.log('Latest session:', {
      id: session.id,
      client_reference_id: session.client_reference_id,
      customer: session.customer,
      subscription: session.subscription
    });
    
    if (!session.client_reference_id || !session.customer || !session.subscription) {
      return NextResponse.json({ 
        error: 'Session missing required data',
        session: {
          id: session.id,
          client_reference_id: session.client_reference_id,
          customer: session.customer,
          subscription: session.subscription
        }
      }, { status: 400 });
    }
    
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    console.log('Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      price_id: subscription.items.data[0]?.price.id,
      current_period_end: subscription.current_period_end
    });
    
    // Check if subscription already exists
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (existing) {
      return NextResponse.json({ 
        message: 'Subscription already exists',
        subscription: existing
      });
    }
    
    // Create the subscription record
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: session.client_reference_id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price.id,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database error',
        details: error
      }, { status: 500 });
    }
    
    console.log('Successfully created subscription:', data);
    
    return NextResponse.json({ 
      success: true,
      subscription: data
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
