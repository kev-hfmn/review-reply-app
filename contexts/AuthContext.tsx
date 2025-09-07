'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import {
  Session,
  User,
  SupabaseClient
} from '@supabase/supabase-js';
import { useSubscriptionQuery } from '@/hooks/queries/useSubscriptionQuery';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
  }>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{
    data: { user: User | null } | null;
    error: Error | null;
  }>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isSubscriber: boolean;
  userAvatarUrl: string | null;
  businesses: { id: string; name: string; industry?: string }[];
  selectedBusinessId: string | null;
  setSelectedBusinessId: (businessId: string | null) => void;
  // Legacy fields for backward compatibility
  businessName: string | null;
  businessId: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [businesses, setBusinesses] = useState<{ id: string; name: string; industry?: string }[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  // Legacy state for backward compatibility
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // NEW: Use centralized subscription query
  const subscriptionQuery = useSubscriptionQuery(user?.id || null)

  // NEW: Sync centralized cache with local state
  useEffect(() => {
    if (subscriptionQuery.data) {
      setIsSubscriber(subscriptionQuery.data.isSubscriber)
      
      // Log subscription details for debugging (preserved)
      console.log(`User ${user?.id} subscription status:`, {
        plan: subscriptionQuery.data.planId,
        status: subscriptionQuery.data.status,
        isSubscriber: subscriptionQuery.data.isSubscriber
      });
    } else if (subscriptionQuery.error) {
      console.error('Subscription check error:', subscriptionQuery.error);
      setIsSubscriber(false);
    }
  }, [subscriptionQuery.data, subscriptionQuery.error, user?.id])

  const loadBusinessInfo = useCallback(async (userId: string) => {
    try {
      // Load ALL user businesses instead of just first one
      // Order by connection status first (connected first), then by creation date (newest first)
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, industry, connection_status, created_at')
        .eq('user_id', userId)
        .order('connection_status', { ascending: false }) // 'connected' comes before 'disconnected'
        .order('created_at', { ascending: false }); // newest first

      if (error) {
        // Only log error if it's not a "no rows" error (PGRST116)
        if (error.code !== 'PGRST116') {
          console.error('Business info load error:', error);
        }
        // For new users without business records, this is expected
        setBusinesses([]);
        setSelectedBusinessId(null);
        setBusinessName(null);
        setBusinessId(null);
        return;
      }

      const businessList = data || [];
      setBusinesses(businessList);

      // Handle business selection logic
      if (businessList.length > 0) {
        // Try to restore previously selected business from localStorage
        const savedBusinessId = localStorage.getItem('selectedBusinessId');
        const validSavedBusiness = businessList.find(b => b.id === savedBusinessId);
        
        let selected: typeof businessList[0];
        if (validSavedBusiness) {
          // Use saved selection if it's still valid
          selected = validSavedBusiness;
        } else {
          // Default to first business if no valid saved selection
          selected = businessList[0];
        }

        setSelectedBusinessId(selected.id);
        // Update legacy fields for backward compatibility
        setBusinessName(selected.name);
        setBusinessId(selected.id);

        // Save selection to localStorage
        localStorage.setItem('selectedBusinessId', selected.id);
      } else {
        setSelectedBusinessId(null);
        setBusinessName(null);
        setBusinessId(null);
        localStorage.removeItem('selectedBusinessId');
      }
    } catch (error) {
      console.error('Business info load error:', error);
      setBusinesses([]);
      setSelectedBusinessId(null);
      setBusinessName(null);
      setBusinessId(null);
    }
  }, []);

  // Handle business selection changes
  const handleBusinessSelection = useCallback((businessId: string | null) => {
    if (businessId && businesses.length > 0) {
      const selected = businesses.find(b => b.id === businessId);
      if (selected) {
        setSelectedBusinessId(businessId);
        // Update legacy fields for backward compatibility
        setBusinessName(selected.name);
        setBusinessId(selected.id);
        // Save selection to localStorage
        localStorage.setItem('selectedBusinessId', businessId);
      }
    } else {
      setSelectedBusinessId(null);
      setBusinessName(null);
      setBusinessId(null);
      localStorage.removeItem('selectedBusinessId');
    }
  }, [businesses]);

  // Business records are now created only during Google Business Profile connection
  // This eliminates signup race conditions and supports multi-location businesses

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    console.log("AuthContext - mounted useEffect:", mounted);

    const initializeAuth = async () => {
      try {
        if (!mounted) return;

        setIsLoading(true);
        console.log("AuthContext - Starting Try in InitializeAuth!");

        // First, get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !mounted) {
          if (mounted) setIsLoading(false);
          return;
        }

        // Update initial state
        if (mounted) {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser && mounted) {
            // Wait for user data loading to complete before setting loading to false
            try {
              // Only load business info - subscription handled by centralized cache
              await loadBusinessInfo(currentUser.id);
            } catch (error) {
              console.error('Error loading user data:', error);
              // Don't throw - allow app to continue with basic auth
            }
          }
        }

        // Then set up listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            console.log('AuthContext: Auth state change:', event, 'Session user:', newSession?.user?.id);

            const newUser = newSession?.user ?? null;
            if (mounted) {
              setUser(newUser);

              if (newUser) {
                console.log('AuthContext: Loading business info for user:', newUser.id);
                // Run business info loading in background - subscription handled by cache
                loadBusinessInfo(newUser.id).catch(error => {
                  console.error('Error loading business data in background:', error);
                });
              } else {
                console.log('AuthContext: Clearing user data - no session');
                setIsSubscriber(false);
                setBusinesses([]);
                setSelectedBusinessId(null);
                setBusinessName(null);
                setBusinessId(null);
              }
            }
          }
        );

        authSubscription = subscription;

        // Only set loading to false after everything is initialized
        if (mounted) {
          console.log('AuthContext: Setting loading to false');
          setIsLoading(false);
        }

      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - critical fix!

  const value = {
    user,
    session,
    isLoading,
    supabase,
    signInWithGoogle: async () => {
      // Use custom auth domain for OAuth callback if available, otherwise fallback to current origin
      const authDomain = process.env.NEXT_PUBLIC_CUSTOM_AUTH_DOMAIN;
      const callbackUrl = authDomain 
        ? `https://${authDomain}/api/auth/proxy-callback`
        : `${window.location.origin}/auth/callback`;
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      });
    },
    signInWithEmail: async (email: string, password: string) => {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Check if user was previously soft-deleted
      const { data: profile } = await supabase
        .from('users')
        .select('is_deleted, deleted_at')
        .eq('id', authData.user?.id)
        .single();

      if (profile?.is_deleted) {
        // Reactivate the account
        await supabase
          .from('users')
          .update({
            is_deleted: false,
            deleted_at: null,
            reactivated_at: new Date().toISOString()
          })
          .eq('id', authData.user?.id);

        // You could trigger a welcome back notification here
      }

      return authData;
    },
    signOut: async () => {
      try {
        // First cleanup all active connections/states
        window.dispatchEvent(new Event('cleanup-before-logout'));

        // Wait a small amount of time for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));

        // Then perform the actual signout
        await supabase.auth.signOut();

        // Force redirect to login
        window.location.assign('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
          // No business_name metadata - businesses created during Google connection
        }
      });
      if (error) throw error;

      // Business records will be created when users connect their Google Business Profile
      // This supports multi-location businesses with real Google location data

      return { data, error };
    },
    updatePassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    },
    updateEmail: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });
      if (error) throw error;
    },
    deleteAccount: async () => {
      // First delete user data from any related tables
      const { error: dataError } = await supabase
        .from('users')
        .delete()
        .eq('id', user?.id);

      if (dataError) throw dataError;

      // Then delete the user's subscription if it exists
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user?.id);

      if (subscriptionError) throw subscriptionError;

      // Finally delete the user's auth account
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user?.id as string
      );

      if (authError) throw authError;

      // Sign out after successful deletion
      await supabase.auth.signOut();
    },
    isSubscriber,
    userAvatarUrl: user?.user_metadata?.avatar_url || null,
    businesses,
    selectedBusinessId,
    setSelectedBusinessId: handleBusinessSelection,
    // Legacy fields for backward compatibility
    businessName,
    businessId,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
