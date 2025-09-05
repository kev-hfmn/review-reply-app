import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

/**
 * Remove a single business from the user's account
 * DELETE /api/auth/google-business/remove-business
 */
export async function DELETE(request: NextRequest) {
  try {
    const { businessId, userId } = await request.json();

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user exists in auth system
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 404 }
      );
    }

    // Verify the business belongs to the user before deletion
    const { data: business, error: verifyError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, google_business_name')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (verifyError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the business (cascade will handle related records)
    const { error: deleteError } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', businessId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting business:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete business' },
        { status: 500 }
      );
    }

    // Create activity log for the deletion
    await supabaseAdmin
      .from('activities')
      .insert({
        business_id: null, // Business no longer exists
        type: 'settings_updated',
        description: `Business disconnected: ${business.google_business_name || business.name}`,
        metadata: {
          event: 'business_removed',
          business_name: business.google_business_name || business.name,
          business_id: businessId,
          timestamp: new Date().toISOString(),
        },
      });

    console.log(`✅ Successfully removed business ${businessId} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Business removed successfully',
      removedBusiness: {
        id: businessId,
        name: business.google_business_name || business.name
      }
    });

  } catch (error) {
    console.error('❌ Business removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}