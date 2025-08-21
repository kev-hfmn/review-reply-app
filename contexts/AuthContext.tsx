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
  signUpWithEmail: (email: string, password: string, businessName: string) => Promise<{ 
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
      // Add safety check for valid user ID
      if (!userId || userId.length < 10) {
        console.warn('Invalid user ID for subscription check:', userId);
        setIsSubscriber(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Subscription check error:', error);
        setIsSubscriber(false);
        return;
      }

      // Only consider active subscriptions (no trials)
      const isValid = data && 
        data.status === 'active' && 
        new Date(data.current_period_end) > new Date();

      setIsSubscriber(!!isValid);
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

  const ensureBusinessRecord = useCallback(async (userId: string) => {
    try {
      // Check if business record already exists
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      // If no business record exists, create one
      if (!existingBusiness) {
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            user_id: userId,
            name: 'My Business'
          })
          .select('id, name')
          .single();
        
        if (error) {
          console.error('Failed to create business record:', error);
          return;
        }
        
        // Update state with new business info
        setBusinessName(data.name);
        setBusinessId(data.id);
        
        console.log('Created business record for user:', userId);
      }
    } catch (error) {
      console.error('Error ensuring business record:', error);
    }
  }, []);

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
              loadBusinessInfo(currentUser.id),
              ensureBusinessRecord(currentUser.id)
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
                  loadBusinessInfo(newUser.id),
                  ensureBusinessRecord(newUser.id)
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
    signUpWithEmail: async (email: string, password: string, businessName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      
      // Create business record immediately after successful signup
      if (data.user) {
        try {
          const { error: businessError } = await supabase
            .from('businesses')
            .insert({
              user_id: data.user.id,
              name: businessName
            });
          
          if (businessError) {
            console.error('Failed to create business record:', businessError);
            // Don't throw here - auth was successful, business can be created later
          }
        } catch (businessError) {
          console.error('Error creating business record:', businessError);
          // Don't throw here - auth was successful, business can be created later
        }
      }
      
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