import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { exchangeCodeForTokens, decodeStateParameter, discoverBusinessLocations } from '@/lib/services/googleOAuthService';
import { encryptFields } from '@/lib/services/encryptionService';

/**
 * Handle Google Business Profile OAuth callback with platform credentials
 * GET /api/auth/google-business/callback
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=oauth_failed`
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in OAuth callback');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=invalid_callback`
      );
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = decodeStateParameter(state);
    } catch (error) {
      console.error('Invalid state parameter:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=invalid_state`
      );
    }

    const { userId } = stateData;
    // businessId from state is now unused - we create businesses from discovered Google locations

    // Verify user exists in auth system
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('User not found in callback:', userError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=user_not_found`
      );
    }

    try {
      console.log('🔄 Exchanging code for tokens with platform credentials...');
      const tokens = await exchangeCodeForTokens(code);
      
      console.log('✅ Tokens received, discovering business locations...');
      const businessLocations = await discoverBusinessLocations(tokens.access_token);
      
      if (businessLocations.length === 0) {
        console.error('No business locations found for user');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=no_business_locations`
        );
      }

      console.log(`🏢 Creating ${businessLocations.length} business record(s) for user ${userId}`);
      
      const createdBusinesses = [];
      const activitiesData = [];
      
      // Create a separate business record for each Google location
      for (const location of businessLocations) {
        console.log(`📍 Creating business for location: ${location.locationName}`);
        
        // Prepare encrypted token data for this location
        const tokenData = {
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_account_id: location.accountId,
          google_location_id: location.locationId,
        };

        const encryptedTokens = encryptFields(tokenData, [
          'google_access_token',
          'google_refresh_token',
          'google_account_id'
          // google_location_id removed - stored as plain text for duplicate detection
        ]);

        // Check for existing business with same user and location ID
        const { data: existingBusiness } = await supabaseAdmin
          .from('businesses')
          .select('id, name')
          .eq('user_id', userId)
          .eq('google_location_id', location.locationId)
          .single();

        let businessRecord;
        let businessError;

        if (existingBusiness) {
          // Update existing business record
          console.log(`📝 Updating existing business for location: ${location.locationName}`);
          const { data: updatedBusiness, error: updateError } = await supabaseAdmin
            .from('businesses')
            .update({
              name: location.locationName,
              location: location.address || null,
              ...encryptedTokens,
              google_location_id: location.locationId, // Store as plain text
              google_account_name: location.accountName,
              google_business_name: location.businessName,
              google_location_name: location.locationName,
              connection_status: 'connected',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingBusiness.id)
            .select('id, name')
            .single();
          
          businessRecord = updatedBusiness;
          businessError = updateError;
        } else {
          // Create new business record
          console.log(`📍 Creating new business for location: ${location.locationName}`);
          const { data: newBusiness, error: insertError } = await supabaseAdmin
            .from('businesses')
            .insert({
              user_id: userId,
              name: location.locationName,
              location: location.address || null,
              ...encryptedTokens,
              google_location_id: location.locationId, // Store as plain text
              google_account_name: location.accountName,
              google_business_name: location.businessName,
              google_location_name: location.locationName,
              connection_status: 'connected',
            })
            .select('id, name')
            .single();
          
          businessRecord = newBusiness;
          businessError = insertError;
        }

        if (businessError) {
          console.error(`Failed to ${existingBusiness ? 'update' : 'create'} business for location ${location.locationName}:`, businessError);
          continue; // Skip this location but continue with others
        }

        createdBusinesses.push(businessRecord);
        
        // Prepare activity log entry
        activitiesData.push({
          business_id: businessRecord.id,
          type: 'settings_updated',
          description: `Google Business Profile connected: ${location.locationName}`,
          metadata: {
            event: 'google_oauth_connected',
            business_name: location.businessName,
            location_name: location.locationName,
            account_id: location.accountId,
            location_id: location.locationId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (createdBusinesses.length === 0) {
        console.error('Failed to create any business records');
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=business_creation_failed`
        );
      }

      // Insert all activity log entries
      if (activitiesData.length > 0) {
        await supabaseAdmin
          .from('activities')
          .insert(activitiesData);
      }

      const businessNames = createdBusinesses.map(b => b.name).join(', ');
      console.log(`✅ Successfully processed ${createdBusinesses.length} business(es):`, businessNames);

      // Redirect to settings with success
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&success=google_connected&business_count=${createdBusinesses.length}&business_names=${encodeURIComponent(businessNames)}`
      );

    } catch (tokenError) {
      console.error('❌ OAuth process failed:', tokenError);
      
      // No business records to update since they're created during success flow
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=oauth_process_failed`
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&error=callback_failed`
    );
  }
}