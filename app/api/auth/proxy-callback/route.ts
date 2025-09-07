import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  console.log('AuthProxy: Processing Supabase OAuth callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const next = requestUrl.searchParams.get('next');
  
  console.log('AuthProxy: URL params:', { 
    code: code ? 'present' : 'missing',
    error,
    next,
    fullUrl: request.url 
  });

  // If there's an error from OAuth provider, redirect to login with error
  if (error) {
    console.error('AuthProxy: OAuth error from provider:', error);
    return NextResponse.redirect(new URL(`/login?error=${error}`, requestUrl.origin));
  }

  // Process direct Google OAuth callback with PKCE
  if (code) {
    console.log('AuthProxy: Processing direct Google OAuth callback with PKCE');
    
    try {
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // For direct OAuth, we need to exchange the Google OAuth code for tokens ourselves
      // then use signInWithIdToken to create the Supabase session
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      
      if (!googleClientId || !googleClientSecret) {
        console.error('AuthProxy: Missing Google OAuth credentials');
        return NextResponse.redirect(new URL('/login?error=config-error', requestUrl.origin));
      }
      
      const authDomain = process.env.NEXT_PUBLIC_CUSTOM_AUTH_DOMAIN;
      const protocol = authDomain?.includes('localhost') ? 'http' : 'https';
      const redirectUri = `${protocol}://${authDomain}/api/auth/proxy-callback`;
      
      // Get the PKCE code verifier from cookies
      const codeVerifier = cookieStore.get('pkce_code_verifier')?.value;
      
      if (!codeVerifier) {
        console.error('AuthProxy: Missing PKCE code verifier');
        return NextResponse.redirect(new URL('/login?error=missing-verifier', requestUrl.origin));
      }
      
      // Exchange code for tokens with Google (including PKCE verifier)
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error('AuthProxy: Failed to exchange code for tokens:', await tokenResponse.text());
        return NextResponse.redirect(new URL('/login?error=token-exchange-failed', requestUrl.origin));
      }
      
      const tokens = await tokenResponse.json();
      console.log('AuthProxy: Received tokens:', {
        id_token: tokens.id_token ? 'present' : 'missing',
        access_token: tokens.access_token ? 'present' : 'missing',
        token_type: tokens.token_type,
        expires_in: tokens.expires_in
      });
      
      // Use the ID token and access token to create a Supabase session
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.id_token,
        access_token: tokens.access_token,
      });
      
      if (signInError) {
        console.error('AuthProxy: Error signing in with ID token:', signInError);
        return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
      }
      
      console.log('AuthProxy: SignIn response:', {
        user: data?.user ? { id: data.user.id, email: data.user.email } : 'none',
        session: data?.session ? { access_token: data.session.access_token ? 'present' : 'missing' } : 'none'
      });

      if (data?.user) {
        console.log('AuthProxy: User authenticated successfully:', data.user.id);
        
        // Log all cookies to debug session storage
        console.log('AuthProxy: Current cookies:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
        
        // Clean up the code verifier cookie
        const response = NextResponse.redirect(
          next ? new URL(next, requestUrl.origin) : new URL('/dashboard', requestUrl.origin)
        );
        response.cookies.set('pkce_code_verifier', '', { 
          path: '/', 
          expires: new Date(0) 
        });
        
        console.log('AuthProxy: Success, redirecting to dashboard');
        return response;
      }

      // Redirect to the next page if provided, otherwise go to dashboard
      const redirectUrl = next ? new URL(next, requestUrl.origin) : new URL('/dashboard', requestUrl.origin);
      console.log('AuthProxy: Success, redirecting to:', redirectUrl.toString());
      
      return NextResponse.redirect(redirectUrl);
      
    } catch (error) {
      console.error('AuthProxy: Unexpected error during token exchange:', error);
      return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
    }
  }

  console.log('AuthProxy: No code present, redirecting to login');
  return NextResponse.redirect(new URL('/login?error=no-auth-code', requestUrl.origin));
}