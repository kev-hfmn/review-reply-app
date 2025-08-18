// RepliFast Email Service - Brevo Integration
// Handles all transactional email sending for the platform

import { 
  EmailResponse, 
  EmailConfig, 
  EmailSendOptions, 
  EmailTemplate, 
  EmailTemplateData,
  EmailTemplateType,
  DigestEmailData,
  ReviewNotificationData,
  ReplyConfirmationData,
  OnboardingEmailData,
  BillingEmailData,
  SystemAlertData,
  AutomationSummaryData,
  AutomationErrorData,
  NewReviewAlertData
} from '@/types/email';
import { supabaseAdmin } from '@/utils/supabase-admin';

export class EmailService {
  private config: EmailConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      apiKey: process.env.BREVO_API_KEY || '',
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'hello@replifast.com',
      senderName: process.env.BREVO_SENDER_NAME || 'RepliFast',
      replyToEmail: process.env.BREVO_REPLY_TO_EMAIL,
      replyToName: process.env.BREVO_REPLY_TO_NAME
    };

    this.initializeBrevo();
  }

  private initializeBrevo(): void {
    try {
      if (!this.config.apiKey) {
        throw new Error('BREVO_API_KEY environment variable is required');
      }

      // Validate API key format
      if (!this.config.apiKey.startsWith('xkeysib-')) {
        throw new Error('Invalid BREVO_API_KEY format. Should start with "xkeysib-"');
      }

      this.isInitialized = true;
      console.log('✅ EmailService: Brevo API configuration validated');
    } catch (error) {
      console.error('❌ EmailService: Failed to initialize Brevo API:', error);
      this.isInitialized = false;
    }
  }

  private validateInitialization(): void {
    if (!this.isInitialized) {
      throw new Error('EmailService is not properly initialized. Check BREVO_API_KEY environment variable.');
    }
  }

  /**
   * Send email using Brevo API via direct HTTP request
   */
  private async sendEmail(
    template: EmailTemplate,
    options: EmailSendOptions,
    retryCount: number = 0
  ): Promise<EmailResponse> {
    this.validateInitialization();

    try {
      // Prepare email data for Brevo API
      const emailData: any = {
        subject: template.subject,
        htmlContent: template.htmlContent,
        sender: {
          email: this.config.senderEmail,
          name: this.config.senderName
        },
        to: options.to
      };

      // Add optional fields
      if (template.textContent) {
        emailData.textContent = template.textContent;
      }

      if (options.cc && options.cc.length > 0) {
        emailData.cc = options.cc;
      }

      if (options.bcc && options.bcc.length > 0) {
        emailData.bcc = options.bcc;
      }

      if (this.config.replyToEmail) {
        emailData.replyTo = {
          email: this.config.replyToEmail,
          name: this.config.replyToName || this.config.senderName
        };
      }

      if (options.attachments && options.attachments.length > 0) {
        emailData.attachment = options.attachments.map(att => ({
          content: att.content,
          name: att.name,
          type: att.type
        }));
      }

      if (options.headers) {
        emailData.headers = options.headers;
      }

      if (options.tags && options.tags.length > 0) {
        emailData.tags = options.tags;
      }

      // Send email via HTTP request
      const response = await this.sendHttpRequest(emailData);
      
      console.log('✅ EmailService: Email sent successfully', {
        messageId: response.messageId,
        recipients: options.to.map(r => r.email),
        subject: template.subject
      });

      return {
        success: true,
        messageId: response.messageId
      };

    } catch (error: any) {
      console.error('❌ EmailService: Failed to send email:', error);

      // Retry logic for transient failures
      if (retryCount < 2 && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`🔄 EmailService: Retrying email send in ${delay}ms (attempt ${retryCount + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendEmail(template, options, retryCount + 1);
      }

      return {
        success: false,
        error: error.message || 'Failed to send email',
        details: error.details || undefined
      };
    }
  }

  /**
   * Send HTTP request to Brevo API
   */
  private async sendHttpRequest(emailData: any): Promise<{ messageId: string }> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      
      const postData = JSON.stringify(emailData);
      
      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'api-key': this.config.apiKey
        }
      };
      
      const req = https.request(options, (res: any) => {
        let data = '';
        
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 201) {
            const response = JSON.parse(data);
            resolve({ messageId: response.messageId });
          } else {
            const errorData = data ? JSON.parse(data) : { message: 'Unknown error' };
            reject({
              message: `HTTP ${res.statusCode}: ${errorData.message || 'Email sending failed'}`,
              details: data,
              statusCode: res.statusCode
            });
          }
        });
      });
      
      req.on('error', (error: any) => {
        reject({
          message: `Network error: ${error.message}`,
          details: error.toString()
        });
      });
      
      req.write(postData);
      req.end();
    });
  }

  private isRetryableError(error: any): boolean {
    // Check if error is retryable (network issues, rate limits, etc.)
    if (error.statusCode) {
      return error.statusCode >= 500 || error.statusCode === 429; // Server errors or rate limits
    }
    return error.message?.includes('Network error') || false; // Network errors are retryable
  }

  /**
   * Log email activity to database
   */
  private async logEmailActivity(
    templateType: EmailTemplateType,
    recipientEmail: string,
    subject: string,
    response: EmailResponse,
    userId?: string,
    businessId?: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('activities')
        .insert({
          business_id: businessId,
          type: 'email_sent',
          description: `Email sent: ${templateType} - ${subject}`,
          metadata: {
            templateType,
            recipientEmail,
            subject,
            messageId: response.messageId,
            success: response.success,
            error: response.error
          }
        });
    } catch (error) {
      console.error('❌ EmailService: Failed to log email activity:', error);
      // Don't throw - email sending should not fail due to logging issues
    }
  }

  /**
   * Send weekly digest export email
   */
  async sendDigestEmail(data: DigestEmailData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.digestExport(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      attachments: data.pdfAttachment ? [data.pdfAttachment] : undefined,
      tags: ['digest', 'export'],
      headers: {
        'X-RepliFast-Type': 'digest-export',
        'X-RepliFast-User-ID': data.userId
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.DIGEST_EXPORT,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send review notification email
   */
  async sendReviewNotification(data: ReviewNotificationData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.reviewNotification(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['review', 'notification'],
      headers: {
        'X-RepliFast-Type': 'review-notification',
        'X-RepliFast-User-ID': data.userId
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.REVIEW_NOTIFICATION,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send reply confirmation email
   */
  async sendReplyConfirmation(data: ReplyConfirmationData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.replyConfirmation(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['reply', 'confirmation'],
      headers: {
        'X-RepliFast-Type': 'reply-confirmation',
        'X-RepliFast-User-ID': data.userId
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.REPLY_CONFIRMATION,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send onboarding welcome email
   */
  async sendOnboardingEmail(data: OnboardingEmailData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.onboarding(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['onboarding', 'welcome'],
      headers: {
        'X-RepliFast-Type': 'onboarding',
        'X-RepliFast-User-ID': data.userId
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.ONBOARDING,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send billing notification email
   */
  async sendBillingEmail(data: BillingEmailData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.billing(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['billing', data.type],
      headers: {
        'X-RepliFast-Type': 'billing',
        'X-RepliFast-User-ID': data.userId,
        'X-RepliFast-Billing-Type': data.type
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.BILLING,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send system alert email
   */
  async sendSystemAlert(data: SystemAlertData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.systemAlert(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['system', 'alert', data.severity],
      headers: {
        'X-RepliFast-Type': 'system-alert',
        'X-RepliFast-User-ID': data.userId,
        'X-RepliFast-Alert-Type': data.alertType,
        'X-RepliFast-Severity': data.severity
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.SYSTEM_ALERT,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send automation summary email
   */
  async sendAutomationSummary(data: AutomationSummaryData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.automationSummary(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['automation', 'summary', 'daily'],
      headers: {
        'X-RepliFast-Type': 'automation-summary',
        'X-RepliFast-User-ID': data.userId,
        'X-RepliFast-Slot-ID': data.slotId
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.AUTOMATION_SUMMARY,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send automation error email
   */
  async sendAutomationError(data: AutomationErrorData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.automationError(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['automation', 'error', 'alert'],
      headers: {
        'X-RepliFast-Type': 'automation-error',
        'X-RepliFast-User-ID': data.userId,
        'X-RepliFast-Error-Type': data.errorType
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.AUTOMATION_ERROR,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Send new review alert email
   */
  async sendNewReviewAlert(data: NewReviewAlertData): Promise<EmailResponse> {
    const { getEmailTemplates } = await import('./emailTemplates');
    const templates = getEmailTemplates();
    
    const template = templates.newReviewAlert(data);
    const options: EmailSendOptions = {
      to: [{ email: data.userEmail, name: data.userName }],
      tags: ['review', 'alert', 'new'],
      headers: {
        'X-RepliFast-Type': 'new-review-alert',
        'X-RepliFast-User-ID': data.userId,
        'X-RepliFast-Review-Count': data.totalNewReviews.toString()
      }
    };

    const response = await this.sendEmail(template, options);
    
    await this.logEmailActivity(
      EmailTemplateType.NEW_REVIEW_ALERT,
      data.userEmail,
      template.subject,
      response,
      data.userId,
      data.businessId
    );

    return response;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail: string): Promise<EmailResponse> {
    const template: EmailTemplate = {
      subject: 'RepliFast Email Configuration Test',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Email Configuration Test</h2>
          <p>This is a test email to verify that your Brevo email configuration is working correctly.</p>
          <p>If you received this email, your RepliFast email system is properly configured!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px;">
            This email was sent from RepliFast at ${new Date().toISOString()}
          </p>
        </div>
      `,
      textContent: 'RepliFast Email Configuration Test - If you received this email, your email system is working correctly!'
    };

    const options: EmailSendOptions = {
      to: [{ email: testEmail, name: 'Test User' }],
      tags: ['test', 'configuration']
    };

    return this.sendEmail(template, options);
  }
}

// Create singleton instance
export const emailService = new EmailService();