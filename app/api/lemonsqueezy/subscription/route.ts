import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LemonSqueezyService } from '@/lib/services/lemonSqueezyService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('id');

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
  }

  try {
    const { data: subscription, error } = await LemonSqueezyService.getSubscriptionDetails(subscriptionId);

    if (error) {
      console.error('Error fetching Lemon Squeezy subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error in subscription route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}