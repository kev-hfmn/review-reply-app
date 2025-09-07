import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('AuthProxy: Processing OAuth callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const next = requestUrl.searchParams.get('next');
  
  console.log('AuthProxy: URL params:', { 
    code: code ? 'present' : 'missing',
    state,
    error,
    next,
    fullUrl: request.url 
  });

  // If there's an error from OAuth provider, redirect to login with error
  if (error) {
    console.error('AuthProxy: OAuth error from provider:', error);
    const origin = requestUrl.origin;
    return NextResponse.redirect(new URL(`/login?error=${error}`, origin));
  }

  // If we have a code, proxy it to the existing Supabase auth callback
  if (code) {
    console.log('AuthProxy: Forwarding OAuth code to Supabase auth callback');
    
    // Build the callback URL for the existing Supabase auth handler
    const callbackUrl = new URL('/auth/callback', requestUrl.origin);
    callbackUrl.searchParams.set('code', code);
    if (state) callbackUrl.searchParams.set('state', state);
    if (next) callbackUrl.searchParams.set('next', next);
    
    console.log('AuthProxy: Redirecting to internal callback:', callbackUrl.toString());
    
    // Redirect to our existing auth callback route which will handle the Supabase auth
    return NextResponse.redirect(callbackUrl);
  }

  console.log('AuthProxy: No code present, redirecting to login');
  return NextResponse.redirect(new URL('/login?error=no-auth-code', requestUrl.origin));
}