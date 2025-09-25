'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';

// TopBar component handles user profile display and navigation
export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();

  // State for tracking logout process
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle user logout with proper server-side session invalidation
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-clicks

    try {
      setIsLoggingOut(true);
      setIsDropdownOpen(false);

      console.log('Starting logout process...');

      // Call our logout API route for proper server-side session invalidation
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        console.error('Logout API failed:', response.status);
      } else {
        console.log('Server-side logout successful');
      }

      // Clear all client-side storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear any remaining cookies manually
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      console.log('Cleared all client-side data, redirecting...');

      // Force hard redirect to login page (this breaks any React state)
      window.location.replace('/login');

    } catch (error) {
      console.error('Logout failed:', error);

      // Fallback: force redirect even if API call fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    } finally {
      // Don't reset loading state since we're redirecting anyway
    }
  };

  return (
    <div className="w-full bg-sidebar border-b border-border shadow-subtle">
      <div className="mx-auto flex justify-between items-center px-4 py-3">
        <Link href="/" className="text-md sm:text-lg font-medium text-foreground flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Image
            src="/icons/icon.png"
            alt="RepliFast"
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="text-xl font-bold text-foreground tracking-tight">RepliFast</span>
        </Link>

        <div className="flex items-center gap-4">
          {!user ? (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-full transition-colors shadow-subtle hover:shadow-hover"
            >
              Sign in
            </Link>
          ) : (
            <>
              {!isLoadingSubscription && (
                !subscription ||
                subscription.status === 'canceled' ||
                (subscription.cancel_at_period_end && new Date(subscription.current_period_end) > new Date())
              ) && (
                <Button
                  onClick={() => router.push('/profile')}
                  className="hidden sm:block rounded-full"
                  variant="default"
                >
                  View Subscription
                </Button>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-primary hover:text-foreground px-3 py-2 rounded-full transition-colors"
                  disabled={isLoggingOut}
                >
                  <UserAvatar size="sm" />
                </button>

                {isDropdownOpen && !isLoggingOut && (
                  <div className="absolute right-0 mt-2 w-48 bg-background rounded-lg shadow-lg py-1 z-[60] border border-border">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile & Subscription
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
