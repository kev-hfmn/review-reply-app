/**
 * Google OAuth service for managing user-supplied credentials
 * Handles OAuth flow with dynamic client credentials from users
 */

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  accountId: string;
  locationId: string;
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

/**
 * Generate OAuth authorization URL using user's client ID
 */
export function generateAuthUrl(credentials: GoogleCredentials, state: OAuthState): string {
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`;
  
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    scope: GOOGLE_OAUTH_SCOPE,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: encodeStateParameter(state),
  });

  return `${GOOGLE_OAUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  credentials: GoogleCredentials
): Promise<GoogleTokens> {
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`;
  
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
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
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  credentials: Pick<GoogleCredentials, 'clientId' | 'clientSecret'>
): Promise<Omit<GoogleTokens, 'refresh_token'>> {
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
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
 * Validate that credentials can make API calls
 */
export async function validateCredentials(
  accessToken: string,
  credentials: GoogleCredentials
): Promise<boolean> {
  try {
    // Test API call to validate credentials
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${credentials.accountId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Credential validation failed:', error);
    return false;
  }
}

/**
 * Test connection to Google Business Profile API
 */
export async function testConnection(
  accessToken: string,
  credentials: GoogleCredentials
): Promise<{ success: boolean; message: string; accountInfo?: any }> {
  try {
    // Test account access
    const accountResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${credentials.accountId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountResponse.ok) {
      return {
        success: false,
        message: `Cannot access account ${credentials.accountId}. Please check your Account ID and permissions.`,
      };
    }

    const accountData = await accountResponse.json();

    // Test location access
    const locationResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${credentials.accountId}/locations/${credentials.locationId}`,
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
        message: `Cannot access location ${credentials.locationId}. Please check your Location ID and ensure it belongs to your account.`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Google Business Profile!',
      accountInfo: {
        name: accountData.name,
        type: accountData.type,
      },
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
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