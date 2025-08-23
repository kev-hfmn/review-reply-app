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
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import ToastNotifications from '@/components/ToastNotifications';
import type { ToastNotification } from '@/types/reviews';
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

interface BillingInfo {
  plan: 'basic' | 'starter' | 'pro' | 'pro plus';
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
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);

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

  // Load actual subscription data
  const loadSubscriptionData = async (
    userId: string,
    mounted: boolean,
    setBilling: React.Dispatch<React.SetStateAction<BillingInfo>>
  ) => {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        return;
      }

      if (mounted) {
        if (subscription && subscription.status === 'active') {
          // Map Stripe price IDs to plan names
          let plan: BillingInfo['plan'] = 'basic';
          if (subscription.stripe_price_id?.includes('starter')) plan = 'starter';
          else if (subscription.stripe_price_id?.includes('pro-plus')) plan = 'pro plus';
          else if (subscription.stripe_price_id?.includes('pro')) plan = 'pro';

          setBilling({
            plan,
            status: 'active',
            nextBilling: subscription.current_period_end
          });
        } else {
          // No active subscription = basic plan
          setBilling({
            plan: 'basic',
            status: 'active'
          });
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      if (!user || !user.id || !mounted) return;

      setIsLoading(true);
      try {
        console.log('Loading settings for user:', user.id);

        // First, get the user's business (without Google fields due to RLS)
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, location, industry, google_business_id, customer_support_email, customer_support_phone, user_id, created_at, updated_at, last_review_sync')
          .eq('user_id', user.id)
          .limit(1);

        console.log('Businesses query result:', { businesses, businessError });

        if (businessError) throw businessError;

        if (businesses && businesses.length > 0 && mounted) {
          const business = businesses[0];
          setCurrentBusinessId(business.id);

          setBusinessProfile({
            name: business.name,
            location: business.location || '',
            industry: business.industry || '',
            googleBusinessId: business.google_business_id || '',
            customerSupportEmail: business.customer_support_email || '',
            customerSupportPhone: business.customer_support_phone || ''
          });

          // Get business settings (including auto sync and automation settings)
          const { data: settings, error: settingsError } = await supabase
            .from('business_settings')
            .select('*, auto_sync_enabled, auto_sync_slot, auto_reply_enabled, auto_post_enabled, email_notifications_enabled, last_automation_run')
            .eq('business_id', business.id)
            .single();

          if (settingsError && settingsError.code === 'PGRST116') {
            // No settings exist, create default ones
            const { error: createError } = await supabase
              .from('business_settings')
              .insert({
                business_id: business.id,
                brand_voice_preset: 'friendly',
                formality_level: 3,
                warmth_level: 3,
                brevity_level: 3,
                approval_mode: 'manual'
              })
              .select()
              .single();

            if (createError) throw createError;

            if (mounted) {
              setBrandVoice({
                preset: 'friendly',
                formality: 3,
                warmth: 3,
                brevity: 3,
                customInstruction: ''
              });

              setApprovalSettings({
                mode: 'manual'
              });
            }
          } else if (settings && mounted) {
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

            // Set auto-sync settings
            setAutoSyncSettings({
              enabled: settings.auto_sync_enabled || false,
              slot: settings.auto_sync_slot || 'slot_1'
            });

            // Set automation settings
            setAutomationSettings({
              autoReplyEnabled: settings.auto_reply_enabled || false,
              autoPostEnabled: settings.auto_post_enabled || false,
              emailNotificationsEnabled: settings.email_notifications_enabled !== false, // Default to true
              lastAutomationRun: settings.last_automation_run || undefined
            });
          }

          // Set integration state with simplified Google integration (now handled by GoogleBusinessProfileIntegration component)
          const integrationState = {
            googleBusiness: {
              connected: false, // Will be managed by GoogleBusinessProfileIntegration component
              status: 'not_connected' as const,
              lastSync: business.last_review_sync
            },
            makeWebhook: {
              connected: !!settings?.make_webhook_url,
              url: settings?.make_webhook_url || ''
            }
          };

          console.log('Setting integration state:', integrationState);
          if (mounted) {
            setIntegrations(integrationState);

            // Load actual subscription data
            await loadSubscriptionData(user.id, mounted, setBilling);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (user && user.id) {
      loadSettings();
    }

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [user]); // Depend on entire user object for stability

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
    if (!currentBusinessId) {
      showToast({
        type: 'error',
        title: 'No business connected',
        message: 'Please connect your Google Business Profile first to save profile settings.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const businessIdToUse = currentBusinessId;
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
        .eq('id', businessIdToUse);

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
    // Business records are created only during Google Business Profile connection
    if (!currentBusinessId) {
      showToast({
        type: 'error',
        title: 'No business connected',
        message: 'Please connect your Google Business Profile first to configure brand voice settings.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const businessIdToUse = currentBusinessId;
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
        .eq('business_id', businessIdToUse);

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
    // Business records are created only during Google Business Profile connection
    if (!currentBusinessId) {
      showToast({
        type: 'error',
        title: 'No business connected',
        message: 'Please connect your Google Business Profile first to configure approval settings.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const businessIdToUse = currentBusinessId;
      const { error } = await supabase
        .from('business_settings')
        .update({
          approval_mode: approvalSettings.mode,
          updated_at: new Date().toISOString()
        })
        .eq('business_id', businessIdToUse);

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
    if (!currentBusinessId) return;

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
        .eq('business_id', currentBusinessId);

      if (error) throw error;

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

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'voice', label: 'Brand Voice', icon: MessageSquare },
    { id: 'approval', label: 'Approval Mode', icon: SettingsIcon },
    { id: 'integrations', label: 'Google Connection', icon: Zap },
   // { id: 'billing', label: 'Billing', icon: CreditCard }
  ];


  if (isLoading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Settings
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Customer Support Contact</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These contact details will be included in AI-generated replies to low-rated reviews (1-3 stars) to help customers reach you directly.
                </p>
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Brand Voice Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-3">
                  Voice Preset
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['friendly', 'professional', 'playful', 'custom'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setBrandVoice(prev => ({ ...prev, preset }))}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        brandVoice.preset === preset
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-foreground/80'
                          : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground/80'
                      }`}
                    >
                      <div className="font-medium capitalize">{preset}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Formality Level: {brandVoice.formality}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={brandVoice.formality}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, formality: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
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
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Warmth Level: {brandVoice.warmth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={brandVoice.warmth}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, warmth: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
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
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Brevity Level: {brandVoice.brevity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={brandVoice.brevity}
                    onChange={(e) => setBrandVoice(prev => ({ ...prev, brevity: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Very Detailed</span>
                    <span>Detailed</span>
                    <span>Moderate</span>
                    <span>Concise</span>
                    <span>Very Concise</span>
                  </div>
                </div>
              </div>

              {/* Custom Instruction */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Custom Instructions
                </label>
                <Textarea
                  value={brandVoice.customInstruction || ''}
                  onChange={(e) => setBrandVoice(prev => ({ ...prev, customInstruction: e.target.value }))}
                  placeholder="Add specific instructions for AI reply generation (e.g., 'Always mention our 24/7 customer service', 'Include a call to action', 'Use our brand terminology')..."
                  className="w-full min-h-[100px] px-3 py-2 border  resize-vertical"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
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
          <div className="space-y-6">
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
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        approvalSettings.mode === mode.id
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => setApprovalSettings({ mode: mode.id as ApprovalSettings['mode'] })}
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

            {/* Automation Pipeline Card */}
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
                      checked={automationSettings.autoReplyEnabled}
                      onCheckedChange={(enabled) => setAutomationSettings(prev => ({ ...prev, autoReplyEnabled: enabled }))}
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
                      checked={automationSettings.autoPostEnabled}
                      onCheckedChange={(enabled) => setAutomationSettings(prev => ({ ...prev, autoPostEnabled: enabled }))}
                      disabled={!automationSettings.autoReplyEnabled}
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
              businessId={currentBusinessId || null}
              onShowToast={showToast}
            />

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
                    <div className={`w-3 h-3 rounded-full ${autoSyncSettings.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {autoSyncSettings.enabled ? 'Auto-sync Enabled' : 'Auto-sync Disabled'}
                      </div>
                      <div className="text-sm text-muted-foreground">
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


          </div>
        )}

        {/* Billing Tab */}
        {/* {activeTab === 'billing' && (
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
                      {billing.status === 'active' ? 'Active' : 'Past Due'}
                    </Badge>
                  </div>
                  {billing.trialEnds && (
                    <p className="text-sm text-muted-foreground">
                      Trial ends: {new Date(billing.trialEnds).toLocaleDateString()}
                    </p>
                  )}
                  {billing.nextBilling && (
                    <p className="text-sm text-muted-foreground">
                      Next billing: {new Date(billing.nextBilling).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                  {billing.plan === 'basic' && (
                    <Button size="sm">
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}
      </motion.div>

      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
