'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  // Moon, // Commented out - used for theme toggle
  // Sun, // Commented out - used for theme toggle
  // Building2, // Commented out - unused
  User
} from 'lucide-react';
// import { Switch } from '@/components/ui/switch'; // Commented out - used for theme toggle
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { useSubscription } from '@/hooks/useSubscription';
// import { useTheme } from '@/contexts/ThemeContext'; // Commented out - used for theme toggle
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reviews', href: '/reviews', icon: MessageSquareText },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
 // { name: 'Profile', href: '/profile', icon: User },
  { name: 'Help', href: '/help', icon: HelpCircle },

];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const { theme, toggleTheme } = useTheme(); // Commented out - used for theme toggle
  const { user, businesses, selectedBusinessId, setSelectedBusinessId } = useAuth();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();

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
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar shadow-lg border border-border lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed shadow-xl shadow-slate-200/70 lg:static inset-y-0 left-0 z-40 h-full
        w-64 bg-slate-50 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 backdrop-blur-sm border-r border-sidebar-border
        transition-all duration-300 ease-out flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo and Brand Area */}
          <div className="hidden lg:flex h-16 items-center px-4 ">
            <Link href="/dashboard" className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
              <Image
                src="/icons/icon.png"
                alt="RepliFast"
                width={32}
                height={32}
                className="rounded-lg flex-shrink-0"
              />
              <span className="text-lg font-semibold text-foreground/90 tracking-tight truncate">
                RepliFast
              </span>
            </Link>
          </div>

          {/* Mobile Logo Area - Shows when mobile menu is open */}
          <div className="lg:hidden flex h-14 items-center px-4">
            <Link href="/dashboard" className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
              <Image
                src="/icons/icon.png"
                alt="RepliFast"
                width={32}
                height={32}
                className="rounded-lg flex-shrink-0"
              />
              <span className="text-lg font-bold text-foreground/90 tracking-tighter truncate">
                RepliFast
              </span>
            </Link>
          </div>
<div className="flex-1 py-5  -translate-y-3 content-center space-y-1">


          {/* Navigation */}
          <nav className="flex-1 px-4 py-5 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 ease-out relative overflow-hidden
                    ${isActive
                      ? 'bg-primary/5 text-primary shadow-sm border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40 hover:shadow-sm border border-transparent hover:border-border/30'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={`
                    flex items-center justify-center w-5 h-5 transition-transform duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                  `}>
                    <item.icon className="w-full h-full" />
                  </div>
                  <span className="relative">
                    {item.name}
                    {/* {isActive && (
                      <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary/70 rounded-full"></div>
                    )} */}
                  </span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 rounded-xl -z-10"></div>
                  )}
                </Link>
              );
            })}
          </nav>
          </div>


          {/* Business Selector Area */}
          <div className="flex h-16 items-center px-4 pb-10">
            <div className="w-full min-w-0">
              {businesses.length > 1 ? (
                <Select
                  value={selectedBusinessId || ''}
                  onValueChange={setSelectedBusinessId}
                >
                  <SelectTrigger className="h-12 text-foreground/90 text-sm font-semibold border border-primary/20 bg-card/70 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 px-3 py-3 rounded-xl min-w-0 w-full group">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-primary/80 group-hover:bg-primary transition-colors duration-200"></div>
                      <div className="truncate text-left text-foreground/90">
                        {selectedBusinessId
                          ? businesses.find(b => b.id === selectedBusinessId)?.name
                          : "Select Business"
                        }
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="w-56 border-border/40 bg-card/95 backdrop-blur-sm shadow-xl">
                    {businesses.map((business) => (
                      <SelectItem
                        key={business.id}
                        value={business.id}
                        className="hover:bg-primary/5 focus:bg-primary/10 transition-colors duration-150"
                      >
                        <div className="flex flex-col gap-1 py-1">
                          <span className="font-semibold text-sm">{business.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-3 h-12 px-4 py-3 rounded-xl bg-card/80 border border-border/30">
                  <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                  <span className="font-semibold text-sm text-foreground/90 truncate min-w-0 flex-1">
                    {businesses[0]?.name || 'Your Business'}
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* User Controls Footer */}
          <div className="px-4 pb-4 pt-6 border-t border-sidebar-border  space-y-4">
            {/* Subscription Button */}
            {user && !isLoadingSubscription && (
              !subscription ||
              subscription.status === 'canceled' ||
              (subscription.cancel_at_period_end && new Date(subscription.current_period_end) > new Date())
            ) && (
              <Button
                onClick={() => router.push('/profile')}
                className="w-full rounded-xl text-sm"
                variant="default"
                size="sm"
              >
                View Subscription
              </Button>
            )}


            {/* User Profile Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex hover:bg-primary/10 hover:scale-[1.01] !rounded-full items-center gap-2 w-full pr-2 hover:bg-card/60 rounded-xl transition-all duration-200 group"
                  disabled={isLoggingOut}
                >
                  <UserAvatar size="lg" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-medium text-foreground/75 truncate">
                      {user.user_metadata?.full_name || user.email || 'User'}
                    </div>

                  </div>
                </button>

                {isDropdownOpen && !isLoggingOut && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-card/95 backdrop-blur-sm rounded-xl shadow-xl py-2 z-[60] border border-border/40">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile & Subscription
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-3 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Copyright */}
            <div className="text-xs text-muted-foreground/70 font-medium text-left pt-2">
              © 2025 RepliFast
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
