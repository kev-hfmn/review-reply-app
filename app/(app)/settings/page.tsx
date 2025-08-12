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
  Webhook,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

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
}

interface ApprovalSettings {
  mode: 'manual' | 'auto_4_plus' | 'auto_except_low';
}

interface IntegrationStatus {
  googleBusiness: {
    connected: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'not_connected';
    lastSync?: string;
  };
  makeWebhook: {
    connected: boolean;
    url?: string;
    lastTest?: string;
  };
}

interface BillingInfo {
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  nextBilling?: string;
  trialEnds?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '',
    location: '',
    industry: ''
  });

  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    preset: 'friendly',
    formality: 5,
    warmth: 7,
    brevity: 5
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

  const [billing, setBilling] = useState<BillingInfo>({
    plan: 'trial',
    status: 'active'
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        setBusinessProfile({
          name: 'Acme Coffee Shop',
          location: 'San Francisco, CA',
          industry: 'Food & Beverage',
          googleBusinessId: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA'
        });

        setIntegrations({
          googleBusiness: {
            connected: true,
            status: 'approved',
            lastSync: '2025-08-12T15:30:00Z'
          },
          makeWebhook: {
            connected: true,
            url: 'https://hook.make.com/abc123def456',
            lastTest: '2025-08-10T10:15:00Z'
          }
        });

        setBilling({
          plan: 'trial',
          status: 'active',
          trialEnds: '2025-08-26T23:59:59Z'
        });
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Business profile saved successfully!');
    } catch {
      console.error('Failed to save business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBrandVoice = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Brand voice settings saved successfully!');
    } catch {
      console.error('Failed to save brand voice settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApproval = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Approval settings saved successfully!');
    } catch {
      console.error('Failed to save approval settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIntegrations(prev => ({
        ...prev,
        makeWebhook: {
          ...prev.makeWebhook,
          lastTest: new Date().toISOString()
        }
      }));
      console.log('Webhook test successful!');
    } catch {
      console.error('Webhook test failed.');
    } finally {
      setIsTesting(false);
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
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
                        <h3 className="font-medium text-slate-900 dark:text-white">{mode.title}</h3>
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
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Google Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    ) : (
                      <Button size="sm">
                        Connect Google
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Webhook className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Make.com Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon('approved', integrations.makeWebhook.connected)}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {integrations.makeWebhook.connected ? 'Connected' : 'Not Connected'}
                      </p>
                      {integrations.makeWebhook.lastTest && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Last test: {new Date(integrations.makeWebhook.lastTest).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.makeWebhook.connected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestWebhook}
                        disabled={isTesting}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {isTesting ? 'Testing...' : 'Test'}
                      </Button>
                    )}
                    <Button size="sm" variant={integrations.makeWebhook.connected ? 'outline' : 'default'}>
                      {integrations.makeWebhook.connected ? 'Update' : 'Setup'}
                    </Button>
                  </div>
                </div>

                {integrations.makeWebhook.url && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={integrations.makeWebhook.url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
    </div>
  );
}
