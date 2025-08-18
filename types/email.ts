// Email system TypeScript types for RepliFast
// Brevo transactional email integration

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailSender {
  email: string;
  name: string;
}

export interface EmailAttachment {
  content: string; // Base64 encoded content
  name: string;
  type?: string; // MIME type (e.g., 'application/pdf')
}

export interface BaseEmailData {
  userId: string;
  businessId?: string;
  businessName?: string;
  userEmail: string;
  userName: string;
}

// Weekly digest export email data
export interface DigestEmailData extends BaseEmailData {
  dateRange: string;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  weekOverWeekChange: {
    reviews: number;
    rating: number;
    responseRate: number;
  };
  topReviews: Array<{
    customerName: string;
    rating: number;
    text: string;
    date: string;
  }>;
  pdfAttachment?: EmailAttachment;
}

// Review notification email data
export interface ReviewNotificationData extends BaseEmailData {
  reviews: Array<{
    id: string;
    googleReviewId: string;
    customerName: string;
    rating: number;
    text: string;
    reviewDate: string;
    requiresReply: boolean;
  }>;
  totalNewReviews: number;
  averageNewRating: number;
}

// Reply confirmation email data
export interface ReplyConfirmationData extends BaseEmailData {
  review: {
    id: string;
    customerName: string;
    rating: number;
    reviewText: string;
    replyText: string;
    postedAt: string;
  };
  businessProfileUrl?: string;
}

// Business onboarding email data
export interface OnboardingEmailData extends BaseEmailData {
  welcomeMessage?: string;
  nextSteps: Array<{
    title: string;
    description: string;
    actionUrl?: string;
  }>;
  supportContactEmail: string;
}

// Billing email data
export interface BillingEmailData extends BaseEmailData {
  type: 'payment_success' | 'payment_failed' | 'subscription_cancelled' | 'subscription_reactivated' | 'plan_upgraded' | 'plan_downgraded';
  amount?: number;
  currency?: string;
  planName?: string;
  nextBillingDate?: string;
  invoiceUrl?: string;
  actionRequired?: boolean;
  actionMessage?: string;
}

// Automation summary email data
export interface AutomationSummaryData extends BaseEmailData {
  slotId: string;
  syncResult: {
    newReviews: number;
    totalReviews: number;
    syncTime: string;
  };
  automationResult: {
    processedReviews: number;
    generatedReplies: number;
    autoApproved: number;
    autoPosted: number;
    emailsSent: number;
    errors: number;
  };
  timeSlot: string; // "12:00 PM UTC (Europe/Africa)" or "12:00 AM UTC (Americas/Asia)"
}

// Automation error email data
export interface AutomationErrorData extends BaseEmailData {
  errorType: string;
  errorMessage: string;
  errorTimestamp: string;
  affectedReviews?: number;
  retryAttempts?: number;
  requiresAttention: boolean;
  recoveryActions?: Array<{
    action: string;
    description: string;
    url?: string;
  }>;
}

// New review alert email data
export interface NewReviewAlertData extends BaseEmailData {
  reviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    text: string;
    reviewDate: string;
    aiReply?: string;
    status: 'pending' | 'approved' | 'posted';
  }>;
  totalNewReviews: number;
  averageRating: number;
  automationEnabled: boolean;
  dashboardUrl: string;
}

// System alert email data
export interface SystemAlertData extends BaseEmailData {
  alertType: 'google_integration_failure' | 'sync_failure' | 'api_quota_exceeded' | 'credential_expired' | 'general_error';
  title: string;
  message: string;
  errorDetails?: string;
  actionRequired: boolean;
  actionUrl?: string;
  actionButtonText?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Email template data union type
export type EmailTemplateData = 
  | DigestEmailData 
  | ReviewNotificationData 
  | ReplyConfirmationData 
  | OnboardingEmailData 
  | BillingEmailData 
  | SystemAlertData
  | AutomationSummaryData
  | AutomationErrorData
  | NewReviewAlertData;

// Email template type enum
export enum EmailTemplateType {
  DIGEST_EXPORT = 'digest_export',
  REVIEW_NOTIFICATION = 'review_notification',
  REPLY_CONFIRMATION = 'reply_confirmation',
  ONBOARDING = 'onboarding',
  BILLING = 'billing',
  SYSTEM_ALERT = 'system_alert',
  AUTOMATION_SUMMARY = 'automation_summary',
  AUTOMATION_ERROR = 'automation_error',
  NEW_REVIEW_ALERT = 'new_review_alert'
}

// Email send response
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: string;
}

// Email configuration
export interface EmailConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  replyToEmail?: string;
  replyToName?: string;
}

// Email send options
export interface EmailSendOptions {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  attachments?: EmailAttachment[];
  templateId?: number; // Brevo template ID if using templates
  tags?: string[];
  headers?: Record<string, string>;
  scheduledAt?: Date;
}

// Email template content
export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

// Email template with data
export interface EmailTemplateWithData {
  template: EmailTemplate;
  data: EmailTemplateData;
  options: EmailSendOptions;
}

// Email send request (for API routes)
export interface EmailSendRequest {
  templateType: EmailTemplateType;
  recipientEmail: string;
  recipientName?: string;
  data: EmailTemplateData;
  options?: Partial<EmailSendOptions>;
}

// Email activity log entry
export interface EmailActivityLog {
  id: string;
  userId: string;
  businessId?: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  error?: string;
  sentAt?: string;
  createdAt: string;
}

// Email preferences
export interface EmailPreferences {
  userId: string;
  reviewNotifications: boolean;
  replyConfirmations: boolean;
  billingNotifications: boolean;
  systemAlerts: boolean;
  digestEmails: boolean;
  marketingEmails: boolean;
  updatedAt: string;
}