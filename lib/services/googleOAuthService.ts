/**
 * Google OAuth service for platform-wide Google Business Profile integration
 * Handles OAuth flow with fixed platform credentials
 */

export interface BusinessLocation {
  accountId: string;
  accountName: string;
  locationId: string;
  locationName: string;
  businessName: string;
  address?: string;
  verified: boolean;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface OAuthState {
  businessId: string;
  userId: string;
  timestamp: number;
}

const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/business.manage';
const GOOGLE_OAUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Platform OAuth credentials from environment
const PLATFORM_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const PLATFORM_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
// Use explicit redirect URI or construct from app URL
const PLATFORM_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`;

/**
 * Generate OAuth authorization URL using platform credentials
 */
export function generateAuthUrl(state: OAuthState): string {
  if (!PLATFORM_CLIENT_ID || !PLATFORM_REDIRECT_URI) {
    throw new Error('Platform OAuth credentials not configured');
  }
  
  const params = new URLSearchParams({
    client_id: PLATFORM_CLIENT_ID,
    redirect_uri: PLATFORM_REDIRECT_URI,
    scope: GOOGLE_OAUTH_SCOPE,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: encodeStateParameter(state),
  });

  return `${GOOGLE_OAUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens using platform credentials
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  if (!PLATFORM_CLIENT_ID || !PLATFORM_CLIENT_SECRET || !PLATFORM_REDIRECT_URI) {
    throw new Error('Platform OAuth credentials not configured');
  }
  
  const params = new URLSearchParams({
    client_id: PLATFORM_CLIENT_ID,
    client_secret: PLATFORM_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: PLATFORM_REDIRECT_URI,
  });

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const tokens = await response.json() as GoogleTokens;
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error(`Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Refresh access token using refresh token with platform credentials
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<Omit<GoogleTokens, 'refresh_token'>> {
  if (!PLATFORM_CLIENT_ID || !PLATFORM_CLIENT_SECRET) {
    throw new Error('Platform OAuth credentials not configured');
  }
  
  const params = new URLSearchParams({
    client_id: PLATFORM_CLIENT_ID,
    client_secret: PLATFORM_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh failed:', errorData);
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const tokens = await response.json();
    
    if (!tokens.access_token) {
      throw new Error('No access token received in refresh response');
    }

    return tokens;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Discover business locations available to the authenticated user
 */
export async function discoverBusinessLocations(accessToken: string): Promise<BusinessLocation[]> {
  try {
    console.log('🔍 Discovering business accounts and locations...');
    
    // Step 1: Get user's accounts
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorData = await accountsResponse.text();
      console.error('Failed to fetch accounts:', errorData);
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    console.log(`📊 Found ${accounts.length} business accounts`);
    
    // Log detailed account information for debugging
    accounts.forEach((account, index) => {
      console.log(`Account ${index + 1}:`, {
        name: account.name,
        accountName: account.accountName,
        type: account.type,
        role: account.role,
        state: account.state,
        organizationInfo: account.organizationInfo
      });
    });

    const allLocations: BusinessLocation[] = [];

    // Step 2: Get locations for each account
    for (const account of accounts) {
      try {
        const accountId = account.name.replace('accounts/', '');
        const locationsResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,metadata`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          const locations = locationsData.locations || [];
          
          for (const location of locations) {
            const locationId = location.name.split('/').pop();
            allLocations.push({
              accountId,
              accountName: account.accountName || `Account ${accountId}`,
              locationId,
              locationName: location.title || 'Unnamed Location',
              businessName: location.title || 'Unnamed Business',
              address: location.storefrontAddress?.addressLines?.join(', '),
              verified: location.metadata?.verificationState === 'VERIFIED' || false,
            });
          }
          
          console.log(`📍 Found ${locations.length} locations for account ${accountId}`);
        } else {
          const errorText = await locationsResponse.text();
          console.error(`❌ Failed to fetch locations for account ${accountId}:`, {
            status: locationsResponse.status,
            statusText: locationsResponse.statusText,
            error: errorText,
            accountInfo: {
              accountId,
              accountName: account.accountName,
              type: account.type,
              role: account.role,
              state: account.state
            }
          });
          
          // For manager accounts, try alternative endpoints or permissions
          if (locationsResponse.status === 403) {
            console.log(`⚠️ Permission denied for account ${accountId} - may be a manager account with limited access`);
          }
        }
      } catch (error) {
        console.error(`Error fetching locations for account ${account.name}:`, error);
        // Continue with other accounts
      }
    }

    console.log(`✅ Total discovered locations: ${allLocations.length}`);
    return allLocations;
  } catch (error) {
    console.error('Error discovering business locations:', error);
    throw new Error(`Failed to discover business locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get detailed business information for a specific account and location
 */
export async function getBusinessInfo(
  accessToken: string,
  accountId: string,
  locationId: string
): Promise<{ success: boolean; message: string; businessInfo?: BusinessLocation }> {
  try {
    // Get location details
    const locationResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?readMask=name,title,storefrontAddress,metadata`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!locationResponse.ok) {
      return {
        success: false,
        message: `Cannot access location ${locationId}. Please ensure you have proper permissions.`,
      };
    }

    const locationData = await locationResponse.json();
    
    return {
      success: true,
      message: 'Successfully retrieved business information!',
      businessInfo: {
        accountId,
        accountName: locationData.accountName || `Account ${accountId}`,
        locationId,
        locationName: locationData.title || 'Unnamed Location',
        businessName: locationData.title || 'Unnamed Business',
        address: locationData.storefrontAddress?.addressLines?.join(', '),
        verified: locationData.metadata?.verificationState === 'VERIFIED' || false,
      },
    };
  } catch (error) {
    console.error('Error getting business info:', error);
    return {
      success: false,
      message: `Failed to get business information: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate that user has access to a specific business location
 */
export async function validateBusinessAccess(
  accessToken: string,
  accountId: string,
  locationId: string
): Promise<boolean> {
  // Note: accountId not needed for v1 locations endpoint but kept for compatibility
  try {
    const response = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?readMask=name,title,storefrontAddress,metadata`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Business access validation failed:', error);
    return false;
  }
}

/**
 * Encode state parameter for OAuth flow
 */
function encodeStateParameter(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64');
}

/**
 * Decode state parameter from OAuth callback
 */
export function decodeStateParameter(stateParam: string): OAuthState {
  try {
    const decoded = Buffer.from(stateParam, 'base64').toString('utf-8');
    const state = JSON.parse(decoded);
    
    // Validate state structure
    if (!state.businessId || !state.userId || !state.timestamp) {
      throw new Error('Invalid state structure');
    }
    
    // Check if state is too old (5 minutes max)
    const now = Date.now();
    if (now - state.timestamp > 5 * 60 * 1000) {
      throw new Error('State parameter expired');
    }
    
    return state;
  } catch (error) {
    console.error('Error decoding state parameter:', error);
    throw new Error('Invalid or expired state parameter');
  }
}

/**
 * Generate a secure random state for CSRF protection
 */
export function generateSecureState(businessId: string, userId: string): OAuthState {
  return {
    businessId,
    userId,
    timestamp: Date.now(),
  };
}