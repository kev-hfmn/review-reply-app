import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('AuthCallback: Processing callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  
  console.log('AuthCallback: URL params:', { 
    code: code ? 'present' : 'missing', 
    next, 
    fullUrl: request.url 
  });

  if (code) {
    console.log('AuthCallback: Exchanging code for session');
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('AuthCallback: Error:', error);
      return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
    }

    if (data?.user) {
      console.log('AuthCallback: User authenticated successfully:', data.user.id);
      
      // For new Google sign-ups, ensure session is established before redirect
      // This helps prevent the /# redirect issue
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Redirect to the next page if provided, otherwise go to dashboard
    const redirectUrl = next ? new URL(next, requestUrl.origin) : new URL('/dashboard', requestUrl.origin);
    console.log('AuthCallback: Success, redirecting to:', redirectUrl.toString());
    
    return NextResponse.redirect(redirectUrl);
  }

  console.log('AuthCallback: No code present, redirecting to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 