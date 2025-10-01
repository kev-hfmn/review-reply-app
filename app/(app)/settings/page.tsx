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
  Globe,
  Clock,
  RefreshCw,
  Clock3Icon,
  PenTool
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import ToastNotifications from '@/components/ToastNotifications';
import type { ToastNotification } from '@/types/reviews';
import { useSubscriptionQuery } from '@/hooks/queries/useSubscriptionQuery';
import { hasFeature } from '@/lib/utils/subscription-client';
import { useBusinessSettingsQuery, useUserBusinessesQuery, useConnectedBusinessesQuery } from '@/hooks/queries/useSettingsQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import GoogleBusinessProfileIntegration from '@/components/GoogleBusinessProfileIntegration';

interface BusinessProfile {
  name: string;
  location: string;
  industry: string;
  googleBusinessId?: string;
  customerSupportEmail?: string;
  customerSupportPhone?: string;
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

interface IntegrationStatus {
  googleBusiness: {
    connected: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'not_connected' | 'configured';
    lastSync?: string;
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

interface AutomationSettings {
  autoReplyEnabled: boolean;
  autoPostEnabled: boolean;
  emailNotificationsEnabled: boolean;
  lastAutomationRun?: string;
}

interface ConnectedBusiness {
  id: string;
  name: string;
  google_business_name?: string;
  google_location_name?: string;
  connection_status: string;
  created_at: string;
  updated_at: string;
}

interface BillingInfo {
  plan: 'basic' | 'starter' | 'pro' | 'pro plus';
  status: 'active' | 'past_due' | 'canceled';
  nextBilling?: string;
  trialEnds?: string;
}

function SettingsPage() {
  const { user, selectedBusinessId } = useAuth();
  const subscriptionQuery = useSubscriptionQuery(user?.id || null);
  const queryClient = useQueryClient();

  // NEW: Cached data queries (same pattern as successful reviews caching)
  const businessSettingsQuery = useBusinessSettingsQuery(selectedBusinessId);
  const userBusinessesQuery = useUserBusinessesQuery(user?.id || null);
  const connectedBusinessesQuery = useConnectedBusinessesQuery(user?.id || null);

  // Initialize active tab from URL parameter
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['profile', 'voice', 'approval', 'integrations', 'billing'].includes(tab)) {
        return tab;
      }
    }
    return 'integrations';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  // NEW: Smart loading state - show cached data immediately, loading only when no cache available
  const isInitialLoading = (userBusinessesQuery.isLoading && !userBusinessesQuery.data) ||
                           (businessSettingsQuery.isLoading && !businessSettingsQuery.data && selectedBusinessId);
  const [isSaving, setIsSaving] = useState(false);

  // Check if values are already on 1-5 scale or need conversion from 1-10 scale
  const convertToNewScale = (oldValue: number): number => {
    // If value is already in 1-5 range, return as-is
    if (oldValue >= 1 && oldValue <= 5) {
      return oldValue;
    }

    // Otherwise, convert from old 1-10 scale to new 1-5 scale
    if (oldValue <= 2) return 1;  // 1-2 → 1
    if (oldValue <= 4) return 2;  // 3-4 → 2
    if (oldValue <= 6) return 3;  // 5-6 → 3
    if (oldValue <= 8) return 4;  // 7-8 → 4
    return 5;                     // 9-10 → 5
  };

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '',
    location: '',
    industry: '',
    customerSupportEmail: '',
    customerSupportPhone: ''
  });

  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    preset: 'friendly',
    formality: 3,
    warmth: 3,
    brevity: 3,
    customInstruction: ''
  });

  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettings>({
    mode: 'manual'
  });

  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    googleBusiness: {
      connected: false,
      status: 'not_connected'
    },
    makeWebhook: {
      connected: false
    }
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [billing, setBilling] = useState<BillingInfo>({
    plan: 'basic',
    status: 'active'
  });

  const [autoSyncSettings, setAutoSyncSettings] = useState<AutoSyncSettings>({
    enabled: false,
    slot: 'slot_1'
  });

  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    autoReplyEnabled: false,
    autoPostEnabled: false,
    emailNotificationsEnabled: true,
    lastAutomationRun: undefined
  });

  const [connectedBusinesses, setConnectedBusinesses] = useState<ConnectedBusiness[]>([]);

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

  // NEW: Sync cached data with local state (same pattern as successful reviews caching)
  useEffect(() => {
    // Sync connected businesses from cache
    if (connectedBusinessesQuery.data) {
      setConnectedBusinesses(connectedBusinessesQuery.data);
    }
  }, [connectedBusinessesQuery.data]);

  useEffect(() => {
    // Sync business profile from cached user businesses
    if (userBusinessesQuery.data && selectedBusinessId) {
      const selectedBusiness = userBusinessesQuery.data.find(b => b.id === selectedBusinessId);
      if (selectedBusiness) {
        setBusinessProfile({
          name: selectedBusiness.name,
          location: selectedBusiness.location || '',
          industry: selectedBusiness.industry || '',
          googleBusinessId: selectedBusiness.google_business_id || '',
          customerSupportEmail: selectedBusiness.customer_support_email || '',
          customerSupportPhone: selectedBusiness.customer_support_phone || ''
        });

        // Update integrations state based on cached business data
        const isGoogleConnected = selectedBusiness.connection_status === 'connected';
        setIntegrations(prev => ({
          ...prev,
          googleBusiness: {
            connected: isGoogleConnected,
            status: isGoogleConnected ? 'approved' as const : 'not_connected' as const,
            lastSync: selectedBusiness.last_review_sync
          }
        }));
      }
    }
  }, [userBusinessesQuery.data, selectedBusinessId]);

  useEffect(() => {
    // Sync business settings from cache
    if (businessSettingsQuery.data) {
      const settings = businessSettingsQuery.data;

      setBrandVoice({
        preset: settings.brand_voice_preset as 'friendly' | 'professional' | 'playful' | 'custom',
        formality: convertToNewScale(settings.formality_level),
        warmth: convertToNewScale(settings.warmth_level),
        brevity: convertToNewScale(settings.brevity_level),
        customInstruction: settings.custom_instruction || ''
      });

      setApprovalSettings({
        mode: settings.approval_mode as 'manual' | 'auto_4_plus' | 'auto_except_low'
      });

      setAutoSyncSettings({
        enabled: settings.auto_sync_enabled || false,
        slot: settings.auto_sync_slot || 'slot_1'
      });

      setAutomationSettings({
        autoReplyEnabled: settings.auto_reply_enabled || false,
        autoPostEnabled: settings.auto_post_enabled || false,
        emailNotificationsEnabled: settings.email_notifications_enabled !== false,
        lastAutomationRun: settings.last_automation_run || undefined
      });

      // Update integrations with webhook info
      setIntegrations(prev => ({
        ...prev,
        makeWebhook: {
          connected: !!settings.make_webhook_url,
          url: settings.make_webhook_url || ''
        }
      }));
    } else if (businessSettingsQuery.error && businessSettingsQuery.error.message.includes('PGRST116')) {
      // No settings exist, create default ones (same logic as original)
      // This will be handled by the mutation when user saves settings
    }
  }, [businessSettingsQuery.data, businessSettingsQuery.error]);

  // NEW: Handle subscription data (reuse existing logic)
  useEffect(() => {
    if (subscriptionQuery.data) {
      const subscription = subscriptionQuery.data;
      if (subscription.isSubscriber) {
        let plan: BillingInfo['plan'] = 'basic';
        if (subscription.planId.includes('starter')) plan = 'starter';
        else if (subscription.planId.includes('pro-plus')) plan = 'pro plus';
        else if (subscription.planId.includes('pro')) plan = 'pro';

        setBilling({
          plan,
          status: 'active',
          nextBilling: subscription.periodEnd || undefined
        });
      } else {
        setBilling({
          plan: 'basic',
          status: 'active'
        });
      }
    }
  }, [subscriptionQuery.data]);

  // OLD subscription loading function removed - now using cached subscriptionQuery

  // NEW: Handle default business settings creation when none exist (simplified from original)
  useEffect(() => {
    if (businessSettingsQuery.error?.message.includes('PGRST116') && selectedBusinessId) {
      // No settings exist, create default ones when user tries to save
      console.log('No business settings found for business:', selectedBusinessId);
    }
  }, [businessSettingsQuery.error, selectedBusinessId]);

  // Check plan features
  const hasAutoSync = subscriptionQuery.data ? hasFeature(subscriptionQuery.data.planId, 'autoSync') : false;
  const hasAutoApproval = subscriptionQuery.data ? hasFeature(subscriptionQuery.data.planId, 'autoApproval') : false;
  const hasCustomVoice = subscriptionQuery.data ? hasFeature(subscriptionQuery.data.planId, 'customVoice') : false;
  const currentPlan = subscriptionQuery.data?.planId || 'basic';
  const currentPlanName = currentPlan === 'pro' ? 'Pro' : currentPlan === 'pro-plus' ? 'Pro Plus' : currentPlan === 'starter' ? 'Starter' : 'Basic';

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
          no_business_locations: 'No business locations found in your Google account. Please ensure you have a verified Google Business Profile set up.',
          credentials_missing: 'Google credentials not configured. Please set up credentials first.',
          token_storage_failed: 'Failed to store OAuth tokens. Please try again.',
          token_exchange_failed: 'Failed to exchange OAuth tokens. Please check your credentials.',
          callback_failed: 'OAuth callback failed. Please try again.',
        };

        const errorMessage = errorMessages[error as keyof typeof errorMessages] || 'An unknown error occurred.';

        showToast({
          type: 'error',
          title: 'Google Connection Failed',
          message: errorMessage
        });

        // Clear the error from URL
        window.history.replaceState({}, '', '/settings?tab=integrations');
      }
    }
  }, []);

  const handleSaveProfile = async () => {
    // Business records are created only during Google Business Profile connection
    if (!selectedBusinessId) {
      showToast({
        type: 'error',
        title: 'No business connected',
        message: 'Please connect your Google Business Profile first to save profile settings.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessProfile.name,
          location: businessProfile.location || null,
          industry: businessProfile.industry || null,
          customer_support_email: businessProfile.customerSupportEmail || null,
          customer_support_phone: businessProfile.customerSupportPhone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBusinessId);

      if (error) throw error;

      // NEW: Invalidate cache after successful mutation (same pattern as reviews)
      queryClient.invalidateQueries({ queryKey: ['user-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['connected-businesses'] });

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
    // Business records are created only during Google Business Profile connection
    if (!selectedBusinessId) {
      showToast({
        type: 'error',
        title: 'No business connected',
        message: 'Please connect your Google Business Profile first to configure brand voice settings.'
      });
      return;
    }

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
        .eq('business_id', selectedBusinessId);

      if (error) throw error;

      // NEW: Invalidate cache after successful mutation (same pattern as reviews)
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });

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
    // Business records are created only during Google Business Profile connection
    if (!selectedBusinessId) {
      showToast({
        type: 'error',
        title: 'No business connected',
        message: 'Please connect your Google Business Profile first to configure approval settings.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          approval_mode: approvalSettings.mode,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', selectedBusinessId);

      if (error) throw error;

      // NEW: Invalidate cache after successful mutation (same pattern as reviews)
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });

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
    if (!selectedBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          auto_sync_enabled: autoSyncSettings.enabled,
          auto_sync_slot: autoSyncSettings.slot,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', selectedBusinessId);

      if (error) throw error;

      const slotTime = autoSyncSettings.slot === 'slot_1' ? '12:00 PM UTC' : '12:00 AM UTC';
      const slotDescription = autoSyncSettings.slot === 'slot_1' ? 'Europe/Africa' : 'Americas/Asia';

      showToast({
        type: 'success',
        title: 'Auto-Sync Settings Saved',
        message: `Automated review sync ${autoSyncSettings.enabled ? `enabled for ${slotTime} (${slotDescription})` : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error saving auto-sync settings:', error);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save auto-sync settings'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAutomation = async () => {
    if (!selectedBusinessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          auto_reply_enabled: automationSettings.autoReplyEnabled,
          auto_post_enabled: automationSettings.autoPostEnabled,
          email_notifications_enabled: automationSettings.emailNotificationsEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', selectedBusinessId);

      if (error) throw error;

      // NEW: Invalidate cache after successful mutation (same pattern as reviews)
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });

      const enabledFeatures = [];
      if (automationSettings.autoReplyEnabled) enabledFeatures.push('AI reply generation');
      if (automationSettings.autoPostEnabled) enabledFeatures.push('automatic posting');
      if (automationSettings.emailNotificationsEnabled) enabledFeatures.push('email notifications');

      showToast({
        type: 'success',
        title: 'Automation Settings Saved',
        message: enabledFeatures.length > 0
          ? `Enabled: ${enabledFeatures.join(', ')}`
          : 'All automation features disabled'
      });
    } catch (error) {
      console.error('Error saving automation settings:', error);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save automation settings'
      });
    } finally {
      setIsSaving(false);
    }
  };


  // Google Business Profile handlers

  const GoogleIcon = () => (
    <img src="/icons/google.png" alt="Google" className="h-5 w-5" />
  );

  const tabs = [
    { id: 'profile', label: 'Business Details', icon: Building2 },
    { id: 'voice', label: 'Brand Voice', icon: PenTool },
    { id: 'automation', label: 'Reply Automation', icon: Clock3Icon },
    { id: 'integrations', label: 'Google Connection', icon: GoogleIcon },

   // { id: 'billing', label: 'Billing', icon: CreditCard }
  ];


  if (isInitialLoading) {
    return (
      <div className="space-y-6 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
          Settings
        </h1>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show connect business message if user has no business
  if (!selectedBusinessId) {
    return (
      <div className="space-y-6"  >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Settings
          </h1>
        </div>

{/*         <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Connect Your Business First
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              To access settings, you need to connect your Google Business Profile first. This will create your business profile and unlock all features.
            </p>
            <Button
              onClick={() => setActiveTab('integrations')}
              className="mt-4"
            >
              <Globe className="h-4 w-4 mr-2" />
              Connect Google Business Profile
            </Button>
          </CardContent>
        </Card> */}

        {/* Still show the integrations tab when requested */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <GoogleBusinessProfileIntegration
              connectedBusinesses={connectedBusinesses}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* Toast Notifications */}
        <ToastNotifications toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col  pb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
              Configure your profile, brand voice, AI reply preferences, and automation rules for Google review management.
            </p>
      </div>

      {/* Tab Navigation */}
      <div className="pb-6">
        <nav className="flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-base
                  transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                  ${isActive
                    ? 'bg-primary/10 text-primary/90 shadow-lg border-2 border-primary/70'
                    : 'bg-card/80 text-foreground/80 border-2 hover:text-primary/80 hover:bg-primary/10 hover:border-primary/70 hover:shadow-lg'
                  }
                `}
              >
                <Icon className={`mr-1 h-5 w-5 ${isActive ? 'text-primary/80' : ''}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
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
          <div>
          <Card className=" border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">

                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-20">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Business Name
                  </label>
                  <Input
                    type="text"
                    value={businessProfile.name}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, name: e.target.value }))}
                    className=""
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Location
                  </label>
                  <Input
                    type="text"
                    value={businessProfile.location}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, location: e.target.value }))}
                    className=""
                    placeholder="City, State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Industry
                  </label>
                  <Select
                    value={businessProfile.industry}
                    onValueChange={(value) => setBusinessProfile(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Professional Services">Professional Services</SelectItem>
                      <SelectItem value="Beauty & Wellness">Beauty & Wellness</SelectItem>
                      <SelectItem value="Automotive">Automotive</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Customer Support Email
                    </label>
                    <Input
                      type="email"
                      value={businessProfile.customerSupportEmail || ''}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, customerSupportEmail: e.target.value }))}
                      className=""
                      placeholder="support@yourbusiness.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Customer Support Phone
                    </label>
                    <Input
                      type="tel"
                      value={businessProfile.customerSupportPhone || ''}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, customerSupportPhone: e.target.value }))}
                      className=""
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  These contact details will be included in AI-generated replies to low-rated reviews (1-3 stars) to help customers reach you directly.
                </p>
              </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-6">
           <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
                </div>
                </div>
        )}

        {/* Brand Voice Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Preset Card */}
              <Card className="text-card-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">

                    Voice Preset
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className=" inline-flex gap-3 flex-wrap">
                    {(['friendly', 'professional', 'playful', 'custom'] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setBrandVoice(prev => ({ ...prev, preset }))}
                        className={`px-5 py-2 !text-sm rounded-full !font-light border text-center transition-colors ${
                          brandVoice.preset === preset
                            ? 'border-primary/70 bg-primary/5 dark:bg-primary/5 text-foreground/80 dark:text-foreground/80'
                            : 'border-border hover:border-primary/70 hover:bg-primary/5 text-muted-foreground hover:text-foreground/80'
                        }`}
                      >
                        <div className="font-medium capitalize">{preset}</div>
                      </button>
                    ))}
                  </div>

                  {/* Voice Preset Descriptions */}
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="space-y-2 text-sm">
                      {brandVoice.preset === 'friendly' && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Friendly:</span> Warm, approachable, and concise tone. Perfect for creating genuine connections with customers while maintaining professionalism.
                        </p>
                      )}
                      {brandVoice.preset === 'professional' && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Professional:</span> Polished, respectful, and concise tone. Ideal for formal businesses that want to maintain a sophisticated image.
                        </p>
                      )}
                      {brandVoice.preset === 'playful' && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Playful:</span> Light, upbeat, and engaging tone. Can include tasteful emojis when natural. Great for creative or fun businesses.
                        </p>
                      )}
                      {brandVoice.preset === 'custom' && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Custom:</span> User-defined tone based on your specific brand instructions below in Custom Instructions. Perfect for unique brand voices and specialized messaging. You can also paste existing review reply templates you have already been using.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tone Adjustments Card */}
              <Card className="text-card-foreground pb-5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">

                    Tone Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Formality Level: {brandVoice.formality}
                    </label>
                    <Slider
                      value={[brandVoice.formality]}
                      onValueChange={(value) => setBrandVoice(prev => ({ ...prev, formality: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Very Casual</span>
                      <span>Casual</span>
                      <span>Balanced</span>
                      <span>Formal</span>
                      <span>Very Formal</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Warmth Level: {brandVoice.warmth}
                    </label>
                    <Slider
                      value={[brandVoice.warmth]}
                      onValueChange={(value) => setBrandVoice(prev => ({ ...prev, warmth: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimal</span>
                      <span>Low</span>
                      <span>Moderate</span>
                      <span>Warm</span>
                      <span>Very Warm</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Brevity Level: {brandVoice.brevity}
                    </label>
                    <Slider
                      value={[brandVoice.brevity]}
                      onValueChange={(value) => setBrandVoice(prev => ({ ...prev, brevity: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Very Detailed</span>
                      <span>Detailed</span>
                      <span>Moderate</span>
                      <span>Concise</span>
                      <span>Very Concise</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Instructions Card - spans full width */}
              <Card className="text-card-foreground lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">

                    Custom Instructions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                  These instructions will be included in every AI-generated reply to ensure consistency with your brand voice and messaging.
                </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Textarea
                    value={brandVoice.customInstruction || ''}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, customInstruction: e.target.value }))}
                    placeholder="Add specific instructions for AI reply generation (e.g., 'Always mention our 24/7 customer service', 'Include a call to action', 'Use our brand terminology')..."
                    className="w-full min-h-[100px] px-3 py-2 border resize-vertical"
                    rows={4}
                  />

                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveBrandVoice} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Voice Settings'}
              </Button>
            </div>
          </div>
        )}



        {/* automation Tab */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            {/* Pro Plan Banner for Automation Features */}
            {!hasAutoSync && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Automation Features Require Pro Plan
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      You&apos;re currently on the {currentPlanName} plan. Upgrade to Pro to unlock automated review sync, AI reply generation, auto-posting, and approval workflows.
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => window.location.href = '/profile'}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Grid layout for Automated Review Sync and Approval Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Automated Review Sync Card */}
            <Card className="text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Automated Review Sync
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically check for new reviews daily at a scheduled time
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${autoSyncSettings.enabled && hasAutoSync ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {autoSyncSettings.enabled && hasAutoSync ? 'Auto-sync Enabled' : 'Auto-sync Disabled'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {autoSyncSettings.enabled && hasAutoSync
                          ? `Daily at ${autoSyncSettings.slot === 'slot_1' ? '12:00 PM UTC (Europe/Africa)' : '12:00 AM UTC (Americas/Asia)'}`
                          : 'Manual review sync only'
                        }
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={autoSyncSettings.enabled && hasAutoSync}
                    onCheckedChange={(enabled) => setAutoSyncSettings(prev => ({ ...prev, enabled }))}
                    disabled={!hasAutoSync}
                  />
                </div>

                {autoSyncSettings.enabled && hasAutoSync && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-3">
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
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-border/80'
                            }`}
                            onClick={() => setAutoSyncSettings(prev => ({ ...prev, slot: slot.id }))}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                                autoSyncSettings.slot === slot.id
                                  ? 'border-primary bg-primary'
                                  : 'border-border'
                              }`}>
                                {autoSyncSettings.slot === slot.id && (
                                  <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{slot.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{slot.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                  <h4 className="text-sm font-medium text-foreground mb-2">How it works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
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



              {/* Approval Mode Card */}
              <Card className="text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SettingsIcon className="h-5 w-5 " />
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
                  ].map((mode) => {
                    const isProFeature = mode.id !== 'manual';
                    const hasAutoApproval = hasFeature(subscriptionQuery.data?.planId || 'basic', 'autoApproval');
                    const isDisabled = isProFeature && !hasAutoApproval;

                    return (
                    <div
                      key={mode.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isDisabled
                          ? 'border-border bg-muted/30 cursor-not-allowed opacity-60'
                          : approvalSettings.mode === mode.id
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer'
                            : 'border-border hover:border-border/80 cursor-pointer'
                      }`}
                      onClick={() => !isDisabled && setApprovalSettings({ mode: mode.id as ApprovalSettings['mode'] })}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                          approvalSettings.mode === mode.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {approvalSettings.mode === mode.id && (
                            <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-card-foreground">{mode.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveApproval} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Approval Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Automation Pipeline Card - Full Width */}
            <Card className="text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Automation Pipeline
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure automated AI reply generation, approval, and posting for new reviews
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Automation Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${automationSettings.autoReplyEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50 border-border'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${automationSettings.autoReplyEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">AI Replies</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {automationSettings.autoReplyEnabled ? 'Auto-generating' : 'Manual only'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${automationSettings.autoPostEnabled ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-muted/50 border-border'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${automationSettings.autoPostEnabled ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">Auto-Posting</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {automationSettings.autoPostEnabled ? 'Auto-posting approved' : 'Manual posting'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${automationSettings.emailNotificationsEnabled ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-muted/50 border-border'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${automationSettings.emailNotificationsEnabled ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">Notifications</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {automationSettings.emailNotificationsEnabled ? 'Email alerts on' : 'No notifications'}
                    </p>
                  </div>
                </div>

                {/* Last Automation Run */}
                {automationSettings.lastAutomationRun && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last automation run: {new Date(automationSettings.lastAutomationRun).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}


                {/* Automation Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        AI Reply Generation
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Automatically generate AI replies for new reviews using your brand voice
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoReplyEnabled && hasAutoSync}
                      onCheckedChange={(enabled) => setAutomationSettings(prev => ({ ...prev, autoReplyEnabled: enabled }))}
                      disabled={!hasAutoSync}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Automatic Reply Posting
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Automatically post approved replies to Google Business Profile
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.autoPostEnabled && hasAutoApproval}
                      onCheckedChange={(enabled) => setAutomationSettings(prev => ({ ...prev, autoPostEnabled: enabled }))}
                      disabled={!hasAutoApproval || !automationSettings.autoReplyEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Email Notifications
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Receive email alerts about new reviews and automation status
                      </p>
                    </div>
                    <Switch
                      checked={automationSettings.emailNotificationsEnabled}
                      onCheckedChange={(enabled) => setAutomationSettings(prev => ({ ...prev, emailNotificationsEnabled: enabled }))}
                    />
                  </div>
                </div>

                {/* Automation Requirements */}
                {(automationSettings.autoReplyEnabled || automationSettings.autoPostEnabled) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Requirements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {autoSyncSettings.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={autoSyncSettings.enabled ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                          Automated review sync must be enabled
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        {integrations.googleBusiness.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={integrations.googleBusiness.status === 'approved' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                          Google Business Profile must be connected and approved
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        {approvalSettings.mode !== 'manual' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={approvalSettings.mode !== 'manual' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                          Auto-approval mode recommended for full automation (currently: {approvalSettings.mode})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Automation Pipeline Flow */}
                {automationSettings.autoReplyEnabled && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">Automation Flow</h4>
                    <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400">
                      <span>New Review</span>
                      <span>→</span>
                      <span>AI Reply</span>
                      {approvalSettings.mode !== 'manual' && (
                        <>
                          <span>→</span>
                          <span>Auto-Approve</span>
                        </>
                      )}
                      {automationSettings.autoPostEnabled && (
                        <>
                          <span>→</span>
                          <span>Auto-Post</span>
                        </>
                      )}
                      {automationSettings.emailNotificationsEnabled && (
                        <>
                          <span>→</span>
                          <span>Email Alert</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAutomation}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Automation Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">


            {/* New Platform OAuth Integration */}
            <GoogleBusinessProfileIntegration
              connectedBusinesses={connectedBusinesses}
              onShowToast={showToast}
            />

          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <Card className="text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground capitalize">
                      {billing.plan} Plan
                    </h3>
                    <Badge variant={billing.status === 'active' ? 'default' : 'destructive'}>
                      {billing.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {billing.plan === 'pro' ? 'Access to all premium features' : 'Basic features only'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-foreground">
                    ${billing.amount}/month
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Next billing: {billing.nextBilling}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                  <Button className="flex-1">
                    {billing.plan === 'basic' ? 'Upgrade to Pro' : 'Change Plan'}
                  </Button>
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

export default SettingsPage;
