'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MessageSquare,
  Settings as SettingsIcon,
  Zap,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  TestTube,
  Globe,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import ToastNotifications from '@/components/ToastNotifications';
import type { ToastNotification } from '@/types/reviews';

interface BusinessProfile {
  name: string;
  location: string;
  industry: string;
  googleBusinessId?: string;
}

interface BrandVoice {
  preset: 'friendly' | 'professional' | 'playful' | 'custom';
  formality: number;
  warmth: number;
  brevity: number;
  customInstruction?: string;
}

interface ApprovalSettings {
  mode: 'manual' | 'auto_4_plus' | 'auto_except_low';
}

interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  accountId: string;
  locationId: string;
}

interface IntegrationStatus {
  googleBusiness: {
    connected: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'not_connected' | 'configured';
    lastSync?: string;
    credentials?: GoogleCredentials;
    hasTokens?: boolean;
  };
  makeWebhook: {
    connected: boolean;
    url?: string;
    lastTest?: string;
  };
}

interface AutoSyncSettings {
  enabled: boolean;
  slot: string;
}

interface BillingInfo {
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  nextBilling?: string;
  trialEnds?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();

  // Initialize active tab from URL parameter
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['profile', 'voice', 'approval', 'integrations', 'billing'].includes(tab)) {
        return tab;
      }
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '',
    location: '',
    industry: ''
  });

  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    preset: 'friendly',
    formality: 5,
    warmth: 7,
    brevity: 5,
    customInstruction: ''
  });

  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings>({
    mode: 'manual'
  });

  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    googleBusiness: {
      connected: false,
      status: 'not_connected',
      hasTokens: false
    },
    makeWebhook: {
      connected: false
    }
  });

  const [googleCredentials, setGoogleCredentials] = useState<GoogleCredentials>({
    clientId: '',
    clientSecret: '',
    accountId: '',
    locationId: ''
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [billing, setBilling] = useState<BillingInfo>({
    plan: 'trial',
    status: 'active'
  });

  const [autoSyncSettings, setAutoSyncSettings] = useState<AutoSyncSettings>({
    enabled: false,
    slot: 'slot_1'
  });

  // Helper function to show toast notifications
  const showToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      id,
      duration: 4000,
      ...toast
    };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  };

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        console.log('Loading settings for user:', user.id);

        // First, get the user's business (without Google fields due to RLS)
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, location, industry, google_business_id, user_id, created_at, updated_at, last_review_sync')
          .eq('user_id', user.id)
          .limit(1);

        console.log('Businesses query result:', { businesses, businessError });

        if (businessError) throw businessError;

        if (businesses && businesses.length > 0) {
          const business = businesses[0];
          setCurrentBusinessId(business.id);

          setBusinessProfile({
            name: business.name,
            location: business.location || '',
            industry: business.industry || '',
            googleBusinessId: business.google_business_id || ''
          });

          // Get business settings (including auto sync settings)
          const { data: settings, error: settingsError } = await supabase
            .from('business_settings')
            .select('*, auto_sync_enabled, auto_sync_slot')
            .eq('business_id', business.id)
            .single();

          if (settingsError && settingsError.code === 'PGRST116') {
            // No settings exist, create default ones
            const { error: createError } = await supabase
              .from('business_settings')
              .insert({
                business_id: business.id,
                brand_voice_preset: 'friendly',
                formality_level: 5,
                warmth_level: 7,
                brevity_level: 5,
                approval_mode: 'manual'
              })
              .select()
              .single();

            if (createError) throw createError;

            setBrandVoice({
              preset: 'friendly',
              formality: 5,
              warmth: 7,
              brevity: 5,
              customInstruction: ''
            });

            setApprovalSettings({
              mode: 'manual'
            });
          } else if (settings) {
            setBrandVoice({
              preset: settings.brand_voice_preset as 'friendly' | 'professional' | 'playful' | 'custom',
              formality: settings.formality_level,
              warmth: settings.warmth_level,
              brevity: settings.brevity_level,
              customInstruction: settings.custom_instruction || ''
            });

            setApprovalSettings({
              mode: settings.approval_mode as 'manual' | 'auto_4_plus' | 'auto_except_low'
            });

            // Set auto-sync settings
            setAutoSyncSettings({
              enabled: settings.auto_sync_enabled || false,
              slot: settings.auto_sync_slot || 'slot_1'
            });
          }

          // Load Google credentials and connection status via API (handles decryption and admin access)
          let hasGoogleCredentials = false;
          let hasGoogleTokens = false;
          let loadedCredentials = {
            clientId: '',
            clientSecret: '',
            accountId: '',
            locationId: ''
          };

          if (user?.id) {
            try {
              console.log('Fetching Google credentials via API...', { businessId: business.id, userId: user.id });
              const credentialsResponse = await fetch(`/api/auth/google-business/credentials/get?businessId=${business.id}&userId=${user.id}`);

              if (!credentialsResponse.ok) {
                console.error('Credentials API error:', credentialsResponse.status, credentialsResponse.statusText);
              }

              const credentialsData = await credentialsResponse.json();

              console.log('Credentials API response:', credentialsData);

              hasGoogleCredentials = credentialsData.hasCredentials || false;
              hasGoogleTokens = credentialsData.hasTokens || false;

              if (credentialsData.hasCredentials && credentialsData.credentials) {
                loadedCredentials = {
                  clientId: credentialsData.credentials.clientId || '',
                  clientSecret: credentialsData.credentials.clientSecret || '',
                  accountId: credentialsData.credentials.accountId || '',
                  locationId: credentialsData.credentials.locationId || ''
                };
                setGoogleCredentials(loadedCredentials);
              }
            } catch (credentialsError) {
              console.error('Failed to load Google credentials:', credentialsError);
            }
          }

          console.log('Google Integration Debug:', {
            hasGoogleCredentials,
            hasGoogleTokens,
            credentialsFromAPI: !!loadedCredentials.clientId
          });

          let googleStatus: 'not_connected' | 'configured' | 'pending' | 'approved' = 'not_connected';
          if (hasGoogleCredentials && hasGoogleTokens) {
            googleStatus = 'approved'; // Connected with both credentials and tokens
            console.log('Setting Google status to: approved (has credentials and tokens)');
          } else if (hasGoogleCredentials) {
            googleStatus = 'configured';
            console.log('Setting Google status to: configured (has credentials, no tokens)');
          } else {
            console.log('Setting Google status to: not_connected');
          }

          // Set integration state after loading credentials
          const integrationState = {
            googleBusiness: {
              connected: hasGoogleTokens,
              status: googleStatus,
              hasTokens: hasGoogleTokens,
              lastSync: business.last_review_sync,
              credentials: loadedCredentials
            },
            makeWebhook: {
              connected: !!settings?.make_webhook_url,
              url: settings?.make_webhook_url || ''
            }
          };

          console.log('Setting integration state:', integrationState);
          setIntegrations(integrationState);

          setBilling({
            plan: 'trial',
            status: 'active',
            trialEnds: '2025-08-26T23:59:59Z'
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user]);

  // Handle OAuth callback feedback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const tab = urlParams.get('tab');

    if (tab === 'integrations') {
      if (success === 'google_connected') {
        console.log('Google Business Profile connected successfully!');
        // Refresh the page data to show the updated connection status
        window.location.replace('/settings?tab=integrations');
      } else if (error) {
        const errorMessages = {
          oauth_failed: 'OAuth authentication failed. Please try again.',
          invalid_callback: 'Invalid OAuth callback. Please try again.',
          invalid_state: 'Invalid OAuth state. Please try again.',
          business_not_found: 'Business not found. Please check your setup.',
          credentials_missing: 'Google credentials not configured. Please set up credentials first.',
          token_storage_failed: 'Failed to store OAuth tokens. Please try again.',
          token_exchange_failed: 'Failed to exchange OAuth tokens. Please check your credentials.',
          callback_failed: 'OAuth callback failed. Please try again.',
        };

        const errorMessage = errorMessages[error as keyof typeof errorMessages] || 'An unknown error occurred.';
        console.error('Google OAuth error:', errorMessage);

        // Clear the error from URL
        window.history.replaceState({}, '', '/settings?tab=integrations');
      }
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!currentBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessProfile.name,
          location: businessProfile.location || null,
          industry: businessProfile.industry || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBusinessId);

      if (error) throw error;

      showToast({
        type: 'success',
        title: 'Profile saved successfully',
        message: 'Your business profile has been updated.'
      });
    } catch (error) {
      console.error('Failed to save business profile:', error);
      showToast({
        type: 'error',
        title: 'Failed to save profile',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBrandVoice = async () => {
    if (!currentBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          brand_voice_preset: brandVoice.preset,
          formality_level: brandVoice.formality,
          warmth_level: brandVoice.warmth,
          brevity_level: brandVoice.brevity,
          custom_instruction: brandVoice.customInstruction || null,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', currentBusinessId);

      if (error) throw error;

      showToast({
        type: 'success',
        title: 'Voice settings saved successfully',
        message: 'Your brand voice configuration has been updated.'
      });
    } catch (error) {
      console.error('Failed to save brand voice settings:', error);
      showToast({
        type: 'error',
        title: 'Failed to save voice settings',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApproval = async () => {
    if (!currentBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          approval_mode: approvalSettings.mode,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', currentBusinessId);

      if (error) throw error;

      showToast({
        type: 'success',
        title: 'Approval settings saved successfully',
        message: 'Your approval mode has been updated.'
      });
    } catch (error) {
      console.error('Failed to save approval settings:', error);
      showToast({
        type: 'error',
        title: 'Failed to save approval settings',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAutoSync = async () => {
    if (!currentBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          auto_sync_enabled: autoSyncSettings.enabled,
          auto_sync_slot: autoSyncSettings.slot,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', currentBusinessId);

      if (error) throw error;

      const slotTime = autoSyncSettings.slot === 'slot_1' ? '12:00 PM UTC' : '12:00 AM UTC';
      const slotDescription = autoSyncSettings.slot === 'slot_1' ? 'Europe/Africa' : 'Americas/Asia';

      showToast({
        type: 'success',
        title: 'Auto-Sync Settings Saved',
        message: `Automated review sync ${autoSyncSettings.enabled ? `enabled for ${slotTime} (${slotDescription})` : 'disabled'} successfully`
      });
    } catch (error: any) {
      console.error('Error saving auto-sync settings:', error);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save auto-sync settings'
      });
    } finally {
      setIsSaving(false);
    }
  };


  // Google Business Profile handlers
  const handleSaveGoogleCredentials = async () => {
    if (!currentBusinessId || !user) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/google-business/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentBusinessId,
          userId: user.id,
          credentials: {
            clientId: googleCredentials.clientId,
            clientSecret: googleCredentials.clientSecret,
            accountId: googleCredentials.accountId,
            locationId: googleCredentials.locationId,
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save credentials');
      }

      setIntegrations(prev => ({
        ...prev,
        googleBusiness: {
          ...prev.googleBusiness,
          status: 'configured'
        }
      }));

      showToast({
        type: 'success',
        title: 'Google credentials saved successfully',
        message: 'You can now connect to Google Business Profile.'
      });
    } catch (error) {
      console.error('Failed to save Google credentials:', error);
      showToast({
        type: 'error',
        title: 'Failed to save Google credentials',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!currentBusinessId || !user) return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/google-business/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentBusinessId,
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate OAuth');
      }
    } catch (error) {
      console.error('Failed to connect Google:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestGoogleConnection = async () => {
    if (!currentBusinessId || !user) return;

    setIsTesting(true);
    try {
      const response = await fetch('/api/reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: currentBusinessId,
          userId: user.id,
          action: 'test'
        })
      });

      const result = await response.json();

      if (result.success) {
        setIntegrations(prev => ({
          ...prev,
          googleBusiness: {
            ...prev.googleBusiness,
            status: 'approved',
            connected: true
          }
        }));
        showToast({
          type: 'success',
          title: 'Google connection test successful',
          message: 'Your Google Business Profile integration is working correctly.'
        });
      } else {
        throw new Error(result.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Google connection test failed:', error);
      showToast({
        type: 'error',
        title: 'Google connection test failed',
        message: error instanceof Error ? error.message : 'Please check your credentials and try again.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!currentBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          google_access_token: null,
          google_refresh_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBusinessId);

      if (error) throw error;

      setIntegrations(prev => ({
        ...prev,
        googleBusiness: {
          ...prev.googleBusiness,
          connected: false,
          hasTokens: false,
          status: googleCredentials.clientId ? 'configured' : 'not_connected'
        }
      }));

      showToast({
        type: 'info',
        title: 'Google Business Profile disconnected',
        message: 'Your Google integration has been disconnected.'
      });
    } catch (error) {
      console.error('Failed to disconnect Google:', error);
      showToast({
        type: 'error',
        title: 'Failed to disconnect Google',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'voice', label: 'Brand Voice', icon: MessageSquare },
    { id: 'approval', label: 'Approval Mode', icon: SettingsIcon },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  const getStatusIcon = (status: string, connected: boolean) => {
    if (!connected || status === 'not_connected' || status === 'rejected') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (status === 'pending') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (status: string, connected: boolean) => {
    if (!connected || status === 'not_connected') return 'Not Connected';
    if (status === 'configured') return 'Credentials Configured';
    if (status === 'pending') return 'Pending Approval';
    if (status === 'approved') return 'Connected';
    if (status === 'rejected') return 'Rejected';
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Business Profile Tab */}
        {activeTab === 'profile' && (
          <Card className=" border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessProfile.name}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={businessProfile.location}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Industry
                  </label>
                  <select
                    value={businessProfile.industry}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Retail">Retail</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Google Business ID
                  </label>
                  <input
                    type="text"
                    value={businessProfile.googleBusinessId || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Auto-filled when connected"
                    disabled
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Brand Voice Tab */}
        {activeTab === 'voice' && (
          <Card className="text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Brand Voice Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Voice Preset
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['friendly', 'professional', 'playful', 'custom'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setBrandVoice(prev => ({ ...prev, preset }))}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        brandVoice.preset === preset
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium capitalize">{preset}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Formality Level: {brandVoice.formality}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brandVoice.formality}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, formality: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Casual</span>
                    <span>Formal</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Warmth Level: {brandVoice.warmth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brandVoice.warmth}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, warmth: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Reserved</span>
                    <span>Warm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Brevity Level: {brandVoice.brevity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brandVoice.brevity}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, brevity: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Detailed</span>
                    <span>Concise</span>
                  </div>
                </div>
              </div>

              {/* Custom Instruction */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={brandVoice.customInstruction || ''}
                  onChange={(e) => setBrandVoice(prev => ({ ...prev, customInstruction: e.target.value }))}
                  placeholder="Add specific instructions for AI reply generation (e.g., 'Always mention our 24/7 customer service', 'Include a call to action', 'Use our brand terminology')..."
                  className="w-full min-h-[100px] px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  rows={4}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  These instructions will be included in every AI-generated reply to ensure consistency with your brand voice and messaging.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBrandVoice} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Voice Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval Mode Tab */}
        {activeTab === 'approval' && (
          <Card className="text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Approval Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    id: 'manual',
                    title: 'Manual Approval',
                    description: 'Review and approve every reply before posting'
                  },
                  {
                    id: 'auto_4_plus',
                    title: 'Auto-approve 4+ Stars',
                    description: 'Automatically post replies to 4 and 5-star reviews'
                  },
                  {
                    id: 'auto_except_low',
                    title: 'Auto-approve Except Low Ratings',
                    description: 'Automatically post replies except for 1 and 2-star reviews'
                  }
                ].map((mode) => (
                  <div
                    key={mode.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      approvalSettings.mode === mode.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => setApprovalSettings({ mode: mode.id as ApprovalSettings['mode'] })}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                        approvalSettings.mode === mode.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {approvalSettings.mode === mode.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-card-foreground">{mode.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mode.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveApproval} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Approval Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Card className="text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Google Business Profile
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Connect your Google Business Profile to automatically fetch reviews
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(integrations.googleBusiness.status, integrations.googleBusiness.connected)}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {getStatusText(integrations.googleBusiness.status, integrations.googleBusiness.connected)}
                      </p>
                      {integrations.googleBusiness.lastSync && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Last sync: {new Date(integrations.googleBusiness.lastSync).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.googleBusiness.connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestGoogleConnection}
                          disabled={isTesting}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {isTesting ? 'Testing...' : 'Test'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDisconnectGoogle}
                          disabled={isSaving}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : integrations.googleBusiness.status === 'configured' ? (
                      <Button
                        size="sm"
                        onClick={handleConnectGoogle}
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect Google'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setShowGoogleSetup(!showGoogleSetup)}
                      >
                        Setup Google
                      </Button>
                    )}
                  </div>
                </div>

                {/* Google Credentials Setup */}
                {(showGoogleSetup || integrations.googleBusiness.status === 'not_connected' || (!integrations.googleBusiness.connected && integrations.googleBusiness.status === 'configured')) && (
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Google Cloud Credentials
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        You need to create a Google Cloud Project and enable the Business Profile API.
                        <a href="#" className="text-blue-600 hover:underline ml-1">View setup guide</a>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={googleCredentials.clientId}
                          onChange={(e) => setGoogleCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your Google Cloud Client ID"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={googleCredentials.clientSecret}
                          onChange={(e) => setGoogleCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your Google Cloud Client Secret"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Account ID
                        </label>
                        <input
                          type="text"
                          value={googleCredentials.accountId}
                          onChange={(e) => setGoogleCredentials(prev => ({ ...prev, accountId: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="accounts/1234567890"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Location ID
                        </label>
                        <input
                          type="text"
                          value={googleCredentials.locationId}
                          onChange={(e) => setGoogleCredentials(prev => ({ ...prev, locationId: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="accounts/1234567890/locations/0987654321"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveGoogleCredentials}
                        disabled={isSaving || !googleCredentials.clientId || !googleCredentials.clientSecret || !googleCredentials.accountId || !googleCredentials.locationId}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Credentials'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Automated Review Sync Card */}
            <Card className="text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Automated Review Sync
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Automatically check for new reviews daily at a scheduled time
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${autoSyncSettings.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {autoSyncSettings.enabled ? 'Auto-sync Enabled' : 'Auto-sync Disabled'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {autoSyncSettings.enabled 
                          ? `Daily at ${autoSyncSettings.slot === 'slot_1' ? '12:00 PM UTC (Europe/Africa)' : '12:00 AM UTC (Americas/Asia)'}`
                          : 'Manual review sync only'
                        }
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={autoSyncSettings.enabled}
                    onCheckedChange={(enabled) => setAutoSyncSettings(prev => ({ ...prev, enabled }))}
                  />
                </div>

                {autoSyncSettings.enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Sync Time Slot
                      </label>
                      <div className="space-y-3">
                        {[
                          {
                            id: 'slot_1',
                            title: 'Slot 1 - 12:00 PM UTC',
                            description: 'Good for Europe and Africa (morning/afternoon business hours)'
                          },
                          {
                            id: 'slot_2', 
                            title: 'Slot 2 - 12:00 AM UTC',
                            description: 'Good for Americas and Asia (evening/morning business hours)'
                          }
                        ].map((slot) => (
                          <div
                            key={slot.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                              autoSyncSettings.slot === slot.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                            onClick={() => setAutoSyncSettings(prev => ({ ...prev, slot: slot.id }))}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                                autoSyncSettings.slot === slot.id
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {autoSyncSettings.slot === slot.id && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">{slot.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{slot.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">How it works:</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Automatically checks for new reviews from your Google Business Profile</li>
                    <li>• Generates AI replies for new reviews based on your brand voice settings</li>
                    <li>• Sends email notifications when new reviews are found</li>
                    <li>• Requires valid Google Business Profile integration</li>
                  </ul>
                  {integrations.googleBusiness.status !== 'approved' && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Google Business Profile must be connected and approved to use automated sync.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveAutoSync} 
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Auto-Sync Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <Card className="text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                      {billing.plan} Plan
                    </h3>
                    <Badge variant={billing.status === 'active' ? 'default' : 'destructive'}>
                      {billing.status === 'active' ? 'Active' : 'Past Due'}
                    </Badge>
                  </div>
                  {billing.trialEnds && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Trial ends: {new Date(billing.trialEnds).toLocaleDateString()}
                    </p>
                  )}
                  {billing.nextBilling && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Next billing: {new Date(billing.nextBilling).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                  {billing.plan === 'trial' && (
                    <Button size="sm">
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
