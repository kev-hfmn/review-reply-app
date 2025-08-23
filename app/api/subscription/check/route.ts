import { NextResponse } from 'next/server';
import { checkUserSubscription } from '@/lib/utils/subscription';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const subscriptionStatus = await checkUserSubscription(userId);

    return NextResponse.json({
      success: true,
      ...subscriptionStatus
    });

  } catch (error) {
    console.error('Subscription check API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check subscription status',
        isSubscriber: false,
        subscription: null,
        planId: 'basic',
        status: 'error',
        isBasic: true,
        isPaid: false
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const subscriptionStatus = await checkUserSubscription(userId);

    return NextResponse.json({
      success: true,
      ...subscriptionStatus
    });

  } catch (error) {
    console.error('Subscription check API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check subscription status',
        isSubscriber: false,
        subscription: null,
        planId: 'basic',
        status: 'error',
        isBasic: true,
        isPaid: false
      },
      { status: 500 }
    );
  }
}
