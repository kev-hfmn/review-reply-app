'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Bot,
  Send,
  Mail,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationMetrics {
  health: {
    status: 'healthy' | 'degraded' | 'critical';
    errorCount: number;
    lastSuccess?: string;
    issues: Array<{
      type: string;
      count: number;
      lastOccurrence: string;
    }>;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    metadata: any;
    created_at: string;
  }>;
  settings: {
    auto_reply_enabled: boolean;
    auto_post_enabled: boolean;
    email_notifications_enabled: boolean;
    last_automation_run?: string;
  };
}

interface AutomationStatusProps {
  businessId: string;
  showTitle?: boolean;
  compact?: boolean;
}

export default function AutomationStatus({ 
  businessId, 
  showTitle = true, 
  compact = false 
}: AutomationStatusProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AutomationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAutomationStatus = async () => {
    if (!user || !businessId) return;

    try {
      setError(null);
      const response = await fetch(`/api/automation/process?businessId=${businessId}&userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load automation status: ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading automation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load automation status');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAutomationStatus();
  };

  const handleRetryFailed = async () => {
    if (!user || !businessId) return;

    try {
      setIsRefreshing(true);
      const response = await fetch('/api/automation/process', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          userId: user.id,
          action: 'retry_failed'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to retry automation');
      }

      // Refresh status after retry
      await loadAutomationStatus();
    } catch (err) {
      console.error('Error retrying automation:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry automation');
    }
  };

  useEffect(() => {
    loadAutomationStatus();
  }, [businessId, user]);

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Degraded</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ai_reply_generated':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'reply_auto_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reply_auto_posted':
        return <Send className="h-4 w-4 text-purple-500" />;
      case 'email_notification_sent':
        return <Mail className="h-4 w-4 text-orange-500" />;
      case 'automation_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (isLoading) {
    return (
      <Card className="text-card-foreground">
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Automation Status
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading automation status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-card-foreground">
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Automation Status
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-red-600 dark:text-red-400">{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card className="text-card-foreground">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Automation Status
            </div>
            <div className="flex items-center gap-2">
              {getHealthBadge(metrics.health.status)}
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {/* Automation Overview */}
        {!compact && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${
              metrics.settings.auto_reply_enabled 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center gap-2">
                <Bot className={`h-4 w-4 ${metrics.settings.auto_reply_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">AI Replies</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {metrics.settings.auto_reply_enabled ? 'Auto-generating' : 'Manual only'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              metrics.settings.auto_post_enabled 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center gap-2">
                <Send className={`h-4 w-4 ${metrics.settings.auto_post_enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">Auto-Posting</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {metrics.settings.auto_post_enabled ? 'Auto-posting approved' : 'Manual posting'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              metrics.settings.email_notifications_enabled 
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center gap-2">
                <Mail className={`h-4 w-4 ${metrics.settings.email_notifications_enabled ? 'text-orange-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {metrics.settings.email_notifications_enabled ? 'Email alerts on' : 'No notifications'}
              </p>
            </div>
          </div>
        )}

        {/* Health Summary */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Health Summary</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {metrics.health.errorCount === 0 
                ? 'All systems operational'
                : `${metrics.health.errorCount} issue${metrics.health.errorCount === 1 ? '' : 's'} detected`
              }
            </p>
          </div>
          {metrics.health.lastSuccess && (
            <div className="text-right">
              <p className="text-xs text-slate-600 dark:text-slate-400">Last successful run</p>
              <p className="text-xs font-medium">{formatRelativeTime(metrics.health.lastSuccess)}</p>
            </div>
          )}
        </div>

        {/* Recent Issues */}
        {metrics.health.issues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white">Recent Issues</h4>
              {metrics.health.errorCount > 0 && (
                <Button onClick={handleRetryFailed} size="sm" variant="outline" disabled={isRefreshing}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Retry Failed
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {metrics.health.issues.slice(0, compact ? 2 : 5).map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-800 dark:text-yellow-400">{issue.type}</span>
                    <Badge variant="secondary" className="text-xs">{issue.count}</Badge>
                  </div>
                  <span className="text-xs text-yellow-600 dark:text-yellow-500">
                    {formatRelativeTime(issue.lastOccurrence)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {!compact && metrics.recentActivities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Recent Activity</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metrics.recentActivities.slice(0, 8).map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-2 rounded border-l-2 border-l-gray-200 dark:border-l-gray-600 bg-gray-50 dark:bg-gray-800"
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Last Automation Run */}
        {metrics.settings.last_automation_run && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Last automation run: {formatRelativeTime(metrics.settings.last_automation_run)}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {compact && metrics.health.errorCount > 0 && (
          <div className="flex justify-end">
            <Button onClick={handleRetryFailed} size="sm" variant="outline" disabled={isRefreshing}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry Failed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}