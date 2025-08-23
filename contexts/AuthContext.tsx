'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import {
  Session,
  User,
  SupabaseClient
} from '@supabase/supabase-js';

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
  businessName: string | null;
  businessId: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const checkSubscription = useCallback(async (userId: string) => {
    try {
      // Call our subscription check API instead of using server-side utility directly
      const response = await fetch('/api/subscription/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Subscription API error:', response.status);
        setIsSubscriber(false);
        return;
      }

      const subscriptionStatus = await response.json();

      setIsSubscriber(subscriptionStatus.isSubscriber);

      // Log subscription details for debugging
      console.log(`User ${userId} subscription status:`, {
        plan: subscriptionStatus.planId,
        status: subscriptionStatus.status,
        isSubscriber: subscriptionStatus.isSubscriber
      });
    } catch (error) {
      console.error('Subscription check error:', error);
      setIsSubscriber(false);
    }
  }, []);

  const loadBusinessInfo = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        // Only log error if it's not a "no rows" error (PGRST116)
        if (error.code !== 'PGRST116') {
          console.error('Business info load error:', error);
        }
        // For new users without business records, this is expected
        setBusinessName(null);
        setBusinessId(null);
        return;
      }

      setBusinessName(data?.name || null);
      setBusinessId(data?.id || null);
    } catch (error) {
      console.error('Business info load error:', error);
      setBusinessName(null);
      setBusinessId(null);
    }
  }, []);

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
            // Run user data loading in background - don't block initial render
            Promise.all([
              checkSubscription(currentUser.id),
              loadBusinessInfo(currentUser.id)
              // ensureBusinessRecord removed to prevent race condition - only called in auth state change
            ]).catch(error => {
              console.error('Error loading user data:', error);
              // Don't throw - allow app to continue with basic auth
            });
          }
        }

        // Then set up listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (!mounted) return;

            const newUser = newSession?.user ?? null;
            if (mounted) {
              setUser(newUser);

              if (newUser) {
                // Run these in background - don't block auth state update
                Promise.all([
                  checkSubscription(newUser.id),
                  loadBusinessInfo(newUser.id)
                  // Business records now created only during Google Business Profile connection
                ]).catch(error => {
                  console.error('Error loading user data in background:', error);
                });
              } else {
                setIsSubscriber(false);
                setBusinessName(null);
                setBusinessId(null);
              }
            }
          }
        );

        authSubscription = subscription;

        // Only set loading to false after everything is initialized
        if (mounted) setIsLoading(false);

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
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
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
