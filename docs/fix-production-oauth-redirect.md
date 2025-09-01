# Fix Production OAuth Redirect Issue

## Problem
When users are in production and complete the Google OAuth flow, they get redirected to localhost instead of staying on the production domain.

## Root Cause
The Google OAuth application is configured with localhost redirect URIs instead of production URLs, OR the production environment variables are not set correctly.

## Solution

### 1. Update Environment Variables in Production

Set these environment variables in your production deployment (Vercel/etc.):

```bash
# Production URL (replace with your actual domain)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-production-domain.com/api/auth/google-business/callback
```

### 2. Update Google Cloud Console OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Add the production redirect URI to "Authorized redirect URIs":
   ```
   https://your-production-domain.com/api/auth/google-business/callback
   ```

### 3. For Vercel Deployment

If using Vercel, set the environment variables in your dashboard:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_APP_URL` = `https://your-production-domain.com`
   - `GOOGLE_OAUTH_REDIRECT_URI` = `https://your-production-domain.com/api/auth/google-business/callback`
   - (Google OAuth credentials if not already set)

### 4. Alternative: Dynamic Redirect URI Construction

The code already supports automatic construction of the redirect URI from `NEXT_PUBLIC_APP_URL`. If you ensure `NEXT_PUBLIC_APP_URL` is set correctly in production, the redirect URI will be constructed automatically:

```typescript
// In googleOAuthService.ts - this is already implemented:
const PLATFORM_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`;
```

## Verification Steps

After making these changes:

1. **Test in Production**: Try the Google Business Profile connection flow
2. **Check Network Tab**: Verify the OAuth redirect goes to the correct production URL
3. **Check Console Logs**: Look for any environment variable loading messages

## Development vs Production URLs

- **Development**: `http://localhost:3000/api/auth/google-business/callback`
- **Production**: `https://your-domain.com/api/auth/google-business/callback`

Both URLs need to be registered in your Google OAuth application's authorized redirect URIs.

## Quick Fix for Immediate Testing

If you need a quick fix for testing, you can temporarily add localhost to your production Google OAuth application:

1. In Google Cloud Console, add both URLs to authorized redirect URIs:
   - `http://localhost:3000/api/auth/google-business/callback` 
   - `https://your-production-domain.com/api/auth/google-business/callback`

2. This allows both development and production to work while you fix the environment variables.

## Security Note

Make sure your production `GOOGLE_OAUTH_CLIENT_SECRET` is different from your development secret, and never commit actual credentials to your repository.