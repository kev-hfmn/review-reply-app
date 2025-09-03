import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

/**
 * Disconnect Google Business Profile integration - DELETE ALL user businesses
 * POST /api/auth/google-business/disconnect
 * 
 * This endpoint disconnects the user's entire Google account and deletes ALL
 * associated businesses, as Google OAuth tokens are account-level, not per-business.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists in auth system
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found or access denied' },
        { status: 404 }
      );
    }

    try {
      // Get ALL businesses for this user before deletion (for logging and response)
      const { data: businesses, error: businessesError } = await supabaseAdmin
        .from('businesses')
        .select('id, name, google_business_name, google_location_name, connection_status, created_at')
        .eq('user_id', userId);

      if (businessesError) {
        console.error('Failed to fetch user businesses:', businessesError);
        return NextResponse.json(
          { error: 'Failed to fetch user businesses' },
          { status: 500 }
        );
      }

      if (!businesses || businesses.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No Google Business Profile connections to disconnect',
          deletedBusinesses: {
            count: 0,
            names: []
          }
        });
      }

      // Collect data for logging and response
      const businessNames = businesses.map(b => 
        b.google_business_name || b.google_location_name || b.name || 'Unknown Business'
      );
      const connectedBusinesses = businesses.filter(b => b.connection_status === 'connected');
      
      console.log(`🔄 Disconnecting Google account for user ${userId}`);
      console.log(`📊 Found ${businesses.length} businesses (${connectedBusinesses.length} connected):`, businessNames);

      // Create comprehensive activity log entry BEFORE deletion
      // Note: This will be deleted along with the businesses, but it serves as a deletion log
      const activityData = businesses.map(business => ({
        business_id: business.id,
        type: 'settings_updated' as const,
        description: `Google Business Profile account disconnected - business deleted: ${business.google_business_name || business.name}`,
        metadata: {
          event: 'google_account_disconnected_business_deleted',
          business_name: business.google_business_name || business.name,
          business_id: business.id,
          deletion_timestamp: new Date().toISOString(),
          total_businesses_deleted: businesses.length,
          user_id: userId,
          note: 'Account-level disconnection - all businesses deleted'
        },
      }));

      // Insert activity logs before deletion
      if (activityData.length > 0) {
        const { error: activityError } = await supabaseAdmin
          .from('activities')
          .insert(activityData);

        if (activityError) {
          console.error('⚠️  Failed to create activity logs (proceeding with deletion):', activityError);
          // Continue with deletion even if activity logging fails
        }
      }

      // DELETE ALL businesses for this user
      // This will CASCADE delete:
      // - reviews (business_id FK)  
      // - business_settings (business_id FK)
      // - activities (business_id FK) 
      // - weekly_digests (business_id FK)
      const { error: deleteError } = await supabaseAdmin
        .from('businesses')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Failed to delete user businesses:', deleteError);
        return NextResponse.json(
          { 
            error: 'Failed to disconnect Google Business Profile', 
            details: deleteError.message 
          },
          { status: 500 }
        );
      }

      console.log(`✅ Successfully deleted ${businesses.length} businesses for user ${userId}`);
      console.log(`📝 Deleted businesses:`, businessNames);

      return NextResponse.json({
        success: true,
        message: 'Google Business Profile account disconnected successfully',
        deletedBusinesses: {
          count: businesses.length,
          names: businessNames,
          connectedCount: connectedBusinesses.length
        }
      });

    } catch (disconnectError) {
      console.error('❌ Error during Google account disconnection:', disconnectError);
      return NextResponse.json(
        { 
          error: 'Failed to disconnect Google Business Profile',
          details: disconnectError instanceof Error ? disconnectError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Disconnect API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disconnect Google Business Profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}