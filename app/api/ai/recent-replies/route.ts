import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { checkUserSubscription, hasFeature } from '@/lib/utils/subscription';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate required parameters
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Check subscription status
    const subscriptionStatus = await checkUserSubscription(userId);
    
    if (!hasFeature(subscriptionStatus.planId, 'aiReplies')) {
      return NextResponse.json(
        {
          error: 'AI replies monitoring not available on Basic plan',
          message: 'AI reply monitoring requires a Starter plan or higher.',
          requiredPlan: 'starter',
          code: 'FEATURE_NOT_AVAILABLE'
        },
        { status: 403 }
      );
    }

    // Verify user has access to this business
    const { data: userBusinesses, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', userId);

    if (businessError) {
      return NextResponse.json(
        { error: 'Failed to fetch user businesses' },
        { status: 500 }
      );
    }

    if (!userBusinesses || userBusinesses.length === 0) {
      return NextResponse.json(
        { error: 'No businesses found for user' },
        { status: 404 }
      );
    }

    const userBusiness = userBusinesses.find(b => b.id === businessId);
    if (!userBusiness) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Get recent AI replies with review context
    const { data: recentReplies, error: repliesError } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        customer_name,
        ai_reply,
        reply_tone,
        updated_at,
        created_at
      `)
      .eq('business_id', businessId)
      .not('ai_reply', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(Math.min(limit, 50)); // Cap at 50 for performance

    if (repliesError) {
      return NextResponse.json(
        { error: `Failed to fetch recent replies: ${repliesError.message}` },
        { status: 500 }
      );
    }

    // Analyze reply patterns for variety insights
    const analysis = analyzeReplyVariety(recentReplies || []);

    return NextResponse.json({
      recentReplies: recentReplies || [],
      analysis,
      metadata: {
        businessId,
        totalReplies: recentReplies?.length || 0,
        limit,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Recent replies API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent replies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze reply variety and provide insights
 */
function analyzeReplyVariety(replies: any[]) {
  if (replies.length === 0) {
    return {
      varietyScore: 100,
      commonOpenings: [],
      repeatedPhrases: [],
      insights: ['No recent AI replies to analyze'],
    };
  }

  const openings: string[] = [];
  const allPhrases: string[] = [];
  const insights: string[] = [];

  // Extract patterns from replies
  replies.forEach(reply => {
    if (reply.ai_reply) {
      const text = reply.ai_reply.toLowerCase();
      const words = text.split(/\s+/);
      
      // Extract opening (first 4 words)
      if (words.length >= 4) {
        openings.push(words.slice(0, 4).join(' '));
      }
      
      // Extract common phrases
      const patterns = [
        /thank you for .{1,15}/g,
        /we appreciate .{1,15}/g,
        /glad (that )?you .{1,15}/g,
        /so happy .{1,15}/g,
        /it('s| is) wonderful .{1,15}/g,
      ];
      
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          allPhrases.push(...matches);
        }
      });
    }
  });

  // Find most common openings
  const openingCounts = openings.reduce((acc: Record<string, number>, opening) => {
    acc[opening] = (acc[opening] || 0) + 1;
    return acc;
  }, {});

  const commonOpenings = Object.entries(openingCounts)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([opening, count]) => ({ opening, count }));

  // Find repeated phrases
  const phraseCounts = allPhrases.reduce((acc: Record<string, number>, phrase) => {
    acc[phrase] = (acc[phrase] || 0) + 1;
    return acc;
  }, {});

  const repeatedPhrases = Object.entries(phraseCounts)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));

  // Calculate variety score (0-100)
  const uniqueOpenings = Object.keys(openingCounts).length;
  const totalOpenings = openings.length;
  const openingVariety = totalOpenings > 0 ? (uniqueOpenings / totalOpenings) * 100 : 100;
  
  const uniquePhrases = Object.keys(phraseCounts).length;
  const totalPhrases = allPhrases.length;
  const phraseVariety = totalPhrases > 0 ? (uniquePhrases / totalPhrases) * 100 : 100;
  
  const varietyScore = Math.round((openingVariety + phraseVariety) / 2);

  // Generate insights
  if (varietyScore < 60) {
    insights.push('High repetition detected - consider adjusting anti-repetition settings');
  } else if (varietyScore < 80) {
    insights.push('Moderate variety - room for improvement in reply diversity');
  } else {
    insights.push('Good variety in AI replies');
  }

  if (commonOpenings.length > 3) {
    insights.push(`${commonOpenings.length} repeated opening patterns found`);
  }

  if (repeatedPhrases.length > 5) {
    insights.push(`${repeatedPhrases.length} commonly repeated phrases detected`);
  }

  const recentCount = replies.filter(r => 
    new Date(r.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;
  
  if (recentCount > 0) {
    insights.push(`${recentCount} replies generated in the last 24 hours`);
  }

  return {
    varietyScore,
    commonOpenings,
    repeatedPhrases,
    insights,
    stats: {
      totalReplies: replies.length,
      uniqueOpenings,
      totalOpenings,
      uniquePhrases,
      totalPhrases,
    },
  };
}
