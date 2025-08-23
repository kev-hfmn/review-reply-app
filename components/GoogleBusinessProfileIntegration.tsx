'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  TestTube,
  Unlink,
  Info,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  GoogleBusinessErrorType,
  parseGoogleBusinessError,
  getGoogleBusinessError,
  createErrorMessage
} from '@/lib/errors/googleBusinessErrors';
import type { ToastNotification } from '@/types/reviews';

interface BusinessInfo {
  accountName: string;
  businessName: string;
  locationName: string;
  verified: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'needs_reconnection' | 'connecting' | 'error';
  lastSync?: string;
  businessInfo?: BusinessInfo;
  lastConnectionAttempt?: string;
  errorType?: GoogleBusinessErrorType;
  errorMessage?: string;
}

interface GoogleBusinessProfileIntegrationProps {
  businessId: string | null;
  onShowToast: (toast: Omit<ToastNotification, 'id'>) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export default function GoogleBusinessProfileIntegration({
  businessId,
  onShowToast,
  onStatusChange
}: GoogleBusinessProfileIntegrationProps) {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    status: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<GoogleBusinessErrorType | null>(null);

  // Load connection status
  const loadConnectionStatus = useCallback(async () => {
    if (!user?.id || !businessId || businessId === 'temp') return;

    try {
      const response = await fetch(`/api/businesses/${businessId}/status?userId=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        const status: ConnectionStatus = {
          connected: data.connected || false,
          status: data.status || 'disconnected',
          lastSync: data.lastSync,
          businessInfo: data.businessInfo,
          lastConnectionAttempt: data.lastConnectionAttempt
        };

        setConnectionStatus(status);
        onStatusChange?.(status);
      } else {
        // If API fails, ensure we stay in disconnected state
        console.error('Status API failed:', response.status, response.statusText);
        setConnectionStatus({
          connected: false,
          status: 'disconnected'
        });
      }
    } catch (error) {
      console.error('Failed to load connection status:', error);
      // Ensure we stay in disconnected state on error
      setConnectionStatus({
        connected: false,
        status: 'disconnected'
      });
    }
  }, [businessId, onStatusChange, user?.id]);

  useEffect(() => {
    if (user?.id && businessId && businessId !== 'temp') {
      loadConnectionStatus();
    }
  }, [user?.id, businessId, loadConnectionStatus]);

  // Check for OAuth success in URL and refresh status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const businessName = urlParams.get('business_name');

    if (success === 'google_connected' && businessName && user?.id && businessId) {
      // Show success toast
      onShowToast({
        type: 'success',
        title: 'Successfully Connected! 🎉',
        message: `Your Google Business Profile "${decodeURIComponent(businessName)}" is now connected and ready to sync reviews.`
      });

      // Refresh connection status
      setTimeout(() => {
        loadConnectionStatus();
      }, 500);
    }
  }, [user?.id, businessId, loadConnectionStatus, onShowToast]);

  const handleConnect = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      console.log('🚀 Initiating platform OAuth connection...');

      const response = await fetch('/api/auth/google-business/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id
          // businessId no longer needed - businesses created from Google locations
        })
      });

      const result = await response.json();

      if (result.authUrl) {
        // Update status to connecting
        setConnectionStatus(prev => ({
          ...prev,
          status: 'connecting'
        }));

        // Redirect to Google OAuth
        window.location.href = result.authUrl;
      } else {
        throw new Error(result.error || 'Failed to initiate OAuth');
      }
    } catch (error) {
      console.error('❌ Connection initiation failed:', error);
      const { error: errorDetails } = createErrorMessage(error);
      setCurrentError(parseGoogleBusinessError(error));

      onShowToast({
        type: 'error',
        title: errorDetails.title,
        message: errorDetails.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      console.log('🔌 Disconnecting Google Business Profile...');

      const response = await fetch('/api/auth/google-business/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          userId: user.id
        })
      });

      const result = await response.json();

      if (response.ok) {
        setConnectionStatus({
          connected: false,
          status: 'disconnected'
        });

        onStatusChange?.({
          connected: false,
          status: 'disconnected'
        });

        onShowToast({
          type: 'info',
          title: 'Disconnected Successfully 👋',
          message: 'Your Google Business Profile has been safely disconnected. You can reconnect anytime.'
        });
      } else {
        throw new Error(result.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('❌ Disconnection failed:', error);
      const { error: errorDetails } = createErrorMessage(error);

      onShowToast({
        type: 'error',
        title: errorDetails.title,
        message: errorDetails.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      console.log('🧪 Testing Google Business Profile connection...');

      // This would call a test endpoint to verify the connection
      const response = await fetch('/api/auth/google-business/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        onShowToast({
          type: 'success',
          title: 'Connection Test Successful ✅',
          message: 'Your Google Business Profile integration is working perfectly! Reviews will sync automatically.'
        });
      } else {
        throw new Error(result.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      const { error: errorDetails } = createErrorMessage(error);
      setCurrentError(parseGoogleBusinessError(error));

      onShowToast({
        type: 'error',
        title: errorDetails.title,
        message: errorDetails.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs_reconnection':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'connecting':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Globe className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Connected to Google Business Profile';
      case 'needs_reconnection':
        return 'Connection needs renewal';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection error';
      default:
        return 'Not connected';
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-900/20">Connected</Badge>;
      case 'needs_reconnection':
        return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-900/20">Needs Reconnection</Badge>;
      case 'connecting':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-900/20">Connecting...</Badge>;
      case 'error':
        return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20">Error</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-800">Disconnected</Badge>;
    }
  };

  return (
    <Card className="text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Google Business Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Google Business Profile to automatically sync reviews and post replies
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">
                  {getStatusText()}
                </p>
                {getStatusBadge()}
              </div>

              {connectionStatus.businessInfo && (
                <div className="mt-1 text-sm text-muted-foreground">
                  <p className="font-medium">{connectionStatus.businessInfo.businessName}</p>
                  <p>{connectionStatus.businessInfo.locationName}</p>
                </div>
              )}

              {connectionStatus.lastSync && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last sync: {new Date(connectionStatus.lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {connectionStatus.connected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isLoading}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </>
            ) : connectionStatus.status === 'needs_reconnection' ? (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isLoading}
                variant="primary"
              >
                <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect securely via Google
              </Button>
            )}
          </div>
        </div>

        {/* How It Works Info */}
        {!connectionStatus.connected && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              How it works:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• One-click connection - no complex setup required</li>
              <li>• Automatically discovers your business locations</li>
              <li>• Securely syncs reviews and enables reply posting</li>
              <li>• Uses platform-wide authentication for better security</li>
            </ul>
          </div>
        )}

        {/* Connection Status Details */}
        {connectionStatus.status === 'needs_reconnection' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Reconnection Required
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Your connection has expired or needs renewal. Click &quot;Reconnect&quot; to restore access to your Google Business Profile.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {connectionStatus.status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20"
          >
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200">
                  Connection Error
                </p>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  There was an issue with your Google Business Profile connection. Please try connecting again.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
