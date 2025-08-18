import { supabase } from '@/utils/supabase';
import { automationService } from './automationService';
import { retryFailedReplies } from './aiReplyService';

export interface AutomationError {
  step: string;
  error: string;
  timestamp: string;
  reviewId?: string;
  businessId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
}

export interface CriticalError extends AutomationError {
  severity: 'critical';
  requiresEscalation: true;
  adminAction: string;
}

export interface RecoveryResult {
  success: boolean;
  retriedTasks: number;
  resolvedErrors: number;
  remainingErrors: number;
  escalatedErrors: number;
}

export interface RetryContext {
  businessId: string;
  userId: string;
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

/**
 * Service that handles automation failures gracefully with recovery mechanisms
 */
export class ErrorRecoveryService {

  /**
   * Handle an automation failure by categorizing and determining recovery strategy
   */
  async handleAutomationFailure(
    error: Omit<AutomationError, 'severity' | 'retryable'>, 
    context?: { businessId?: string; userId?: string }
  ): Promise<void> {
    try {
      // Categorize the error
      const categorizedError = this.categorizeError(error);

      // Log the error
      await this.logError(categorizedError, context);

      // Determine recovery action
      if (categorizedError.severity === 'critical') {
        await this.escalateToAdmin(categorizedError as CriticalError);
      } else if (categorizedError.retryable) {
        await this.scheduleRetry(categorizedError, context);
      }

    } catch (handlingError) {
      console.error('Failed to handle automation failure:', handlingError);
      // Try to log this critical failure
      await this.logCriticalSystemError(error, handlingError);
    }
  }

  /**
   * Retry failed automation tasks for a specific business
   */
  async retryFailedAutomation(businessId: string, retryContext?: Partial<RetryContext>): Promise<RecoveryResult> {
    const context: RetryContext = {
      businessId,
      userId: '',
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      exponentialBackoff: true,
      ...retryContext,
    };

    const result: RecoveryResult = {
      success: true,
      retriedTasks: 0,
      resolvedErrors: 0,
      remainingErrors: 0,
      escalatedErrors: 0,
    };

    try {
      // Get business settings and failed automation data
      const { data: settings, error: settingsError } = await supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', businessId)
        .single();

      if (settingsError || !settings) {
        throw new Error(`Failed to fetch business settings: ${settingsError?.message}`);
      }

      // Retry AI reply generation for failed reviews
      if (settings.auto_reply_enabled) {
        const replyRetryResult = await retryFailedReplies(businessId);
        result.retriedTasks += replyRetryResult.results.length;
        result.resolvedErrors += replyRetryResult.successCount;
        result.remainingErrors += replyRetryResult.failureCount;
      }

      // Retry failed review syncing
      await this.retryFailedReviewSync(businessId, context);

      // Retry failed reply posting
      await this.retryFailedReplyPosting(businessId, context);

      // Retry failed email notifications
      await this.retryFailedNotifications(businessId, context);

      // Clear resolved automation errors
      await this.clearResolvedErrors(businessId);

      // Log recovery completion
      await this.logRecoveryActivity(businessId, result);

    } catch (error) {
      result.success = false;
      console.error('Error during automation recovery:', error);
      
      await this.handleAutomationFailure({
        step: 'automation_recovery',
        error: error instanceof Error ? error.message : 'Unknown recovery error',
        timestamp: new Date().toISOString(),
      }, { businessId });
    }

    return result;
  }

  /**
   * Escalate critical errors to admin/system monitoring
   */
  async escalateToAdmin(error: CriticalError): Promise<void> {
    try {
      // Log critical error with special flag
      await supabase.from('activities').insert({
        business_id: null, // System-level activity
        type: 'automation_failed',
        description: `CRITICAL ERROR: ${error.error}`,
        metadata: {
          error_details: error,
          escalated: true,
          requires_admin_action: true,
          admin_action: error.adminAction,
          escalated_at: new Date().toISOString(),
        },
      });

      // Send admin notification (if configured)
      await this.sendAdminNotification(error);

      // Update system error tracking
      await this.updateSystemErrorTracking(error);

    } catch (escalationError) {
      console.error('Failed to escalate critical error:', escalationError);
    }
  }

  /**
   * Determine if an error should be retried based on error type and history
   */
  shouldRetry(error: AutomationError, retryCount: number = 0): boolean {
    // Don't retry if not marked as retryable
    if (!error.retryable) return false;

    // Don't retry critical errors
    if (error.severity === 'critical') return false;

    // Limit retry attempts
    if (retryCount >= 3) return false;

    // Check error-specific retry logic
    switch (error.step) {
      case 'generate_ai_reply':
        // Retry AI generation failures up to 2 times
        return retryCount < 2;
      
      case 'post_reply':
        // Retry posting failures up to 3 times
        return retryCount < 3;
      
      case 'send_notification':
        // Retry email failures up to 1 time
        return retryCount < 1;
      
      case 'review_sync':
        // Retry sync failures up to 2 times
        return retryCount < 2;
      
      default:
        // Default retry policy
        return retryCount < 2;
    }
  }

  /**
   * Get automation health status for a business
   */
  async getAutomationHealth(businessId: string): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    errorCount: number;
    lastSuccess?: string;
    issues: Array<{
      type: string;
      count: number;
      lastOccurrence: string;
    }>;
  }> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get recent automation errors
      const { data: errors } = await supabase
        .from('activities')
        .select('*')
        .eq('business_id', businessId)
        .eq('type', 'automation_failed')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      // Get last successful automation
      const { data: lastSuccess } = await supabase
        .from('business_settings')
        .select('last_automation_run')
        .eq('business_id', businessId)
        .single();

      const errorCount = errors?.length || 0;
      
      // Categorize issues
      const issueMap = new Map<string, { count: number; lastOccurrence: string }>();
      
      errors?.forEach(error => {
        const errorType = error.metadata?.step || 'unknown';
        const existing = issueMap.get(errorType) || { count: 0, lastOccurrence: error.created_at };
        issueMap.set(errorType, {
          count: existing.count + 1,
          lastOccurrence: error.created_at > existing.lastOccurrence ? error.created_at : existing.lastOccurrence,
        });
      });

      const issues = Array.from(issueMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      }));

      // Determine health status
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (errorCount > 10) {
        status = 'critical';
      } else if (errorCount > 3) {
        status = 'degraded';
      }

      return {
        status,
        errorCount,
        lastSuccess: lastSuccess?.last_automation_run || undefined,
        issues,
      };

    } catch (error) {
      console.error('Error getting automation health:', error);
      return {
        status: 'critical',
        errorCount: -1,
        issues: [],
      };
    }
  }

  /**
   * Categorize error by severity and retryability
   */
  private categorizeError(error: Omit<AutomationError, 'severity' | 'retryable'>): AutomationError {
    let severity: AutomationError['severity'] = 'medium';
    let retryable = true;

    // Categorize based on error step and message
    switch (error.step) {
      case 'generate_ai_reply':
        if (error.error.includes('rate limit') || error.error.includes('quota')) {
          severity = 'high';
          retryable = true;
        } else if (error.error.includes('authentication') || error.error.includes('API key')) {
          severity = 'critical';
          retryable = false;
        } else {
          severity = 'medium';
          retryable = true;
        }
        break;

      case 'post_reply':
        if (error.error.includes('authentication') || error.error.includes('credentials')) {
          severity = 'critical';
          retryable = false;
        } else if (error.error.includes('rate limit')) {
          severity = 'high';
          retryable = true;
        } else {
          severity = 'medium';
          retryable = true;
        }
        break;

      case 'send_notification':
        severity = 'low';
        retryable = true;
        break;

      case 'automation_pipeline':
        severity = 'critical';
        retryable = false;
        break;

      default:
        severity = 'medium';
        retryable = true;
    }

    return {
      ...error,
      severity,
      retryable,
    };
  }

  /**
   * Schedule a retry for a failed task
   */
  private async scheduleRetry(
    error: AutomationError, 
    context?: { businessId?: string; userId?: string }
  ): Promise<void> {
    // For now, just log the retry schedule
    // In a production system, this could use a job queue
    await this.logError({
      ...error,
      step: 'retry_scheduled',
      error: `Retry scheduled for: ${error.error}`,
    }, context);
  }

  /**
   * Retry failed review synchronization
   */
  private async retryFailedReviewSync(businessId: string, context: RetryContext): Promise<void> {
    try {
      // Call the manual sync API to retry
      const response = await fetch('/api/reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId,
          retryFailures: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to retry review sync');
      }

    } catch (error) {
      await this.handleAutomationFailure({
        step: 'retry_review_sync',
        error: error instanceof Error ? error.message : 'Unknown sync retry error',
        timestamp: new Date().toISOString(),
      }, { businessId: context.businessId });
    }
  }

  /**
   * Retry failed reply posting
   */
  private async retryFailedReplyPosting(businessId: string, context: RetryContext): Promise<void> {
    try {
      // Get approved reviews that failed to post
      const { data: failedPosts } = await supabase
        .from('reviews')
        .select('id, final_reply, ai_reply')
        .eq('business_id', businessId)
        .eq('status', 'approved')
        .is('posted_at', null);

      if (!failedPosts || failedPosts.length === 0) return;

      // Retry posting each failed review
      for (const review of failedPosts) {
        try {
          const response = await fetch('/api/reviews/post-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reviewId: review.id,
              reply: review.final_reply || review.ai_reply,
              businessId,
              retry: true,
            }),
          });

          if (!response.ok) {
            console.error(`Failed to retry post for review ${review.id}`);
          }
        } catch (postError) {
          console.error(`Error retrying post for review ${review.id}:`, postError);
        }
      }

    } catch (error) {
      await this.handleAutomationFailure({
        step: 'retry_reply_posting',
        error: error instanceof Error ? error.message : 'Unknown posting retry error',
        timestamp: new Date().toISOString(),
      }, { businessId: context.businessId });
    }
  }

  /**
   * Retry failed email notifications
   */
  private async retryFailedNotifications(businessId: string, context: RetryContext): Promise<void> {
    try {
      // For simplicity, we'll just try to send a recovery notification
      const response = await fetch('/api/email/automation-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          userId: context.userId,
          retryAttempt: true,
        }),
      });

      if (!response.ok) {
        console.error('Failed to retry notification sending');
      }

    } catch (error) {
      console.error('Error retrying notifications:', error);
    }
  }

  /**
   * Clear resolved automation errors from business settings
   */
  private async clearResolvedErrors(businessId: string): Promise<void> {
    try {
      const { data: settings } = await supabase
        .from('business_settings')
        .select('automation_errors')
        .eq('business_id', businessId)
        .single();

      if (settings && Array.isArray(settings.automation_errors)) {
        // Keep only recent errors (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentErrors = settings.automation_errors.filter((error: any) => 
          new Date(error.timestamp) > oneDayAgo
        );

        await supabase
          .from('business_settings')
          .update({
            automation_errors: recentErrors,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', businessId);
      }
    } catch (error) {
      console.error('Error clearing resolved errors:', error);
    }
  }

  /**
   * Log error to activities table
   */
  private async logError(
    error: AutomationError, 
    context?: { businessId?: string; userId?: string }
  ): Promise<void> {
    try {
      await supabase.from('activities').insert({
        business_id: context?.businessId || null,
        type: 'automation_failed',
        description: `${error.step}: ${error.error}`,
        metadata: {
          ...error,
          user_id: context?.userId,
          logged_at: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error('Failed to log automation error:', logError);
    }
  }

  /**
   * Log critical system errors
   */
  private async logCriticalSystemError(originalError: any, handlingError: any): Promise<void> {
    try {
      await supabase.from('activities').insert({
        business_id: null,
        type: 'automation_failed',
        description: 'CRITICAL: Error handler failed',
        metadata: {
          original_error: originalError,
          handling_error: handlingError instanceof Error ? handlingError.message : handlingError,
          system_failure: true,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (finalError) {
      console.error('CRITICAL: Cannot log system errors to database:', finalError);
    }
  }

  /**
   * Send admin notification for critical errors
   */
  private async sendAdminNotification(error: CriticalError): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll just log it
      console.error('ADMIN NOTIFICATION REQUIRED:', {
        error: error.error,
        action: error.adminAction,
        timestamp: error.timestamp,
      });
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
    }
  }

  /**
   * Update system-wide error tracking
   */
  private async updateSystemErrorTracking(error: CriticalError): Promise<void> {
    try {
      // This could update a system monitoring dashboard
      // For now, we'll increment a counter in the database
      // Implementation depends on your monitoring setup
      console.log('System error tracking updated for critical error:', error.step);
    } catch (trackingError) {
      console.error('Failed to update system error tracking:', trackingError);
    }
  }

  /**
   * Log recovery activity completion
   */
  private async logRecoveryActivity(businessId: string, result: RecoveryResult): Promise<void> {
    try {
      await supabase.from('activities').insert({
        business_id: businessId,
        type: 'automation_failed', // Using existing enum value
        description: 'Automation recovery completed',
        metadata: {
          recovery_result: result,
          recovery_completed_at: new Date().toISOString(),
          activity_subtype: 'automation_recovery',
        },
      });
    } catch (error) {
      console.error('Failed to log recovery activity:', error);
    }
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService();