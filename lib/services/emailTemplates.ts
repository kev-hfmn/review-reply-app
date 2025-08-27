// RepliFast Email Templates
// HTML email templates with RepliFast branding for all business email types

import {
  EmailTemplate,
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

// Base email styles matching RepliFast branding
const baseStyles = `
  <style>
    .email-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      line-height: 1.6;
      color: #374151;
    }
    .header {
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #3B82F6;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #2563EB;
    }
    .card {
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    .metric {
      display: inline-block;
      background-color: #EFF6FF;
      border: 1px solid #DBEAFE;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 4px;
      font-weight: 500;
    }
    .alert-high { border-left: 4px solid #DC2626; }
    .alert-medium { border-left: 4px solid #F59E0B; }
    .alert-low { border-left: 4px solid #10B981; }
    .footer {
      background-color: #F9FAFB;
      padding: 20px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
      border-top: 1px solid #E5E7EB;
    }
    .rating {
      color: #F59E0B;
      font-weight: bold;
    }
    .stars {
      color: #F59E0B;
    }
  </style>
`;

/**
 * Weekly digest export email template
 */
function digestExportTemplate(data: DigestEmailData): EmailTemplate {
  const trendIcon = (change: number) => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➡️';
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const subject = `Your Weekly Review Digest - ${data.dateRange}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">📊 RepliFast</h1>
          <p style="color: #E0E7FF; margin: 8px 0 0 0;">Weekly Review Digest</p>
        </div>

        <div class="content">
          <h2>Hello ${data.userName}! 👋</h2>
          <p>Here's your weekly review digest for <strong>${data.businessName || 'your business'}</strong> covering ${data.dateRange}.</p>

          <div class="card">
            <h3 style="margin-top: 0;">📈 Key Metrics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
              <div class="metric">
                <div style="font-size: 24px; font-weight: bold; color: #3B82F6;">${data.totalReviews}</div>
                <div style="font-size: 12px; color: #6B7280;">Total Reviews</div>
                <div style="font-size: 12px;">${trendIcon(data.weekOverWeekChange.reviews)} ${formatChange(data.weekOverWeekChange.reviews)}</div>
              </div>
              <div class="metric">
                <div style="font-size: 24px; font-weight: bold; color: #F59E0B;">⭐ ${data.averageRating.toFixed(1)}</div>
                <div style="font-size: 12px; color: #6B7280;">Avg Rating</div>
                <div style="font-size: 12px;">${trendIcon(data.weekOverWeekChange.rating)} ${formatChange(data.weekOverWeekChange.rating)}</div>
              </div>
              <div class="metric">
                <div style="font-size: 24px; font-weight: bold; color: #10B981;">${data.responseRate}%</div>
                <div style="font-size: 12px; color: #6B7280;">Response Rate</div>
                <div style="font-size: 12px;">${trendIcon(data.weekOverWeekChange.responseRate)} ${formatChange(data.weekOverWeekChange.responseRate)}</div>
              </div>
            </div>
          </div>

          ${data.topReviews.length > 0 ? `
          <div class="card">
            <h3 style="margin-top: 0;">⭐ Top Reviews This Week</h3>
            ${data.topReviews.map(review => `
              <div style="border-bottom: 1px solid #E5E7EB; padding: 12px 0; margin: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong>${review.customerName}</strong>
                  <span class="rating">${'⭐'.repeat(review.rating)} ${review.rating}/5</span>
                </div>
                <p style="margin: 8px 0; font-style: italic; color: #6B7280;">"${review.text.length > 100 ? review.text.substring(0, 100) + '...' : review.text}"</p>
                <small style="color: #9CA3AF;">${new Date(review.date).toLocaleDateString()}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/digest" class="button">View Full Digest 📊</a>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            ${data.pdfAttachment ? 'A detailed PDF report is attached to this email. 📎' : ''}
          </p>
        </div>

        <div class="footer">
          <p>Keep up the great work managing your reviews! 🚀</p>
          <p>
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Manage email preferences</a> |
            <a href="https://support.replifast.com" style="color: #3B82F6;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * Review notification email template
 */
function reviewNotificationTemplate(data: ReviewNotificationData): EmailTemplate {
  const subject = `${data.totalNewReviews} New Review${data.totalNewReviews > 1 ? 's' : ''} Need${data.totalNewReviews === 1 ? 's' : ''} Your Attention`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">🔔 RepliFast</h1>
          <p style="color: #E0E7FF; margin: 8px 0 0 0;">New Review Alert</p>
        </div>

        <div class="content">
          <h2>Hello ${data.userName}! 👋</h2>
          <p>You have <strong>${data.totalNewReviews} new review${data.totalNewReviews > 1 ? 's' : ''}</strong> for <strong>${data.businessName || 'your business'}</strong> that need${data.totalNewReviews === 1 ? 's' : ''} your attention.</p>

          <div class="card">
            <h3 style="margin-top: 0;">📊 Summary</h3>
            <div style="display: flex; gap: 20px; margin: 16px 0;">
              <div class="metric">
                <div style="font-size: 20px; font-weight: bold; color: #3B82F6;">${data.totalNewReviews}</div>
                <div style="font-size: 12px; color: #6B7280;">New Reviews</div>
              </div>
              <div class="metric">
                <div style="font-size: 20px; font-weight: bold; color: #F59E0B;">⭐ ${data.averageNewRating.toFixed(1)}</div>
                <div style="font-size: 12px; color: #6B7280;">Average Rating</div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 style="margin-top: 0;">📝 Recent Reviews</h3>
            ${data.reviews.slice(0, 3).map(review => `
              <div style="border-bottom: 1px solid #E5E7EB; padding: 12px 0; margin: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong>${review.customerName}</strong>
                  <span class="rating">${'⭐'.repeat(review.rating)} ${review.rating}/5</span>
                </div>
                <p style="margin: 8px 0; color: #374151;">"${review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text}"</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <small style="color: #9CA3AF;">${new Date(review.reviewDate).toLocaleDateString()}</small>
                  ${review.requiresReply ? '<span style="background-color: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Needs Reply</span>' : ''}
                </div>
              </div>
            `).join('')}

            ${data.reviews.length > 3 ? `
              <p style="text-align: center; color: #6B7280; margin: 16px 0;">
                ... and ${data.reviews.length - 3} more review${data.reviews.length - 3 > 1 ? 's' : ''}
              </p>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/reviews" class="button">Manage Reviews 💬</a>
          </div>
        </div>

        <div class="footer">
          <p>Respond quickly to maintain great customer relationships! ⚡</p>
          <p>
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Manage notifications</a> |
            <a href="https://support.replifast.com" style="color: #3B82F6;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * Reply confirmation email template
 */
function replyConfirmationTemplate(data: ReplyConfirmationData): EmailTemplate {
  const subject = `Reply Posted Successfully to Google Business Profile`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">✅ RepliFast</h1>
          <p style="color: #E0E7FF; margin: 8px 0 0 0;">Reply Confirmation</p>
        </div>

        <div class="content">
          <h2>Reply Posted Successfully! 🎉</h2>
          <p>Hello ${data.userName}, your reply has been successfully posted to Google Business Profile.</p>

          <div class="card">
            <h3 style="margin-top: 0;">📝 Review Details</h3>
            <div style="margin: 16px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <strong>${data.review.customerName}</strong>
                <span class="rating">${'⭐'.repeat(data.review.rating)} ${data.review.rating}/5</span>
              </div>
              <div style="background-color: #F3F4F6; padding: 12px; border-radius: 6px; margin: 12px 0;">
                <p style="margin: 0; font-style: italic; color: #374151;">"${data.review.reviewText.length > 200 ? data.review.reviewText.substring(0, 200) + '...' : data.review.reviewText}"</p>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 style="margin-top: 0;">💬 Your Reply</h3>
            <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px; margin: 12px 0;">
              <p style="margin: 0; color: #374151;">${data.review.replyText}</p>
            </div>
            <p style="color: #6B7280; font-size: 14px; margin: 8px 0 0 0;">
              Posted on ${new Date(data.review.postedAt).toLocaleString()}
            </p>
          </div>

          ${data.businessProfileUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.businessProfileUrl}" class="button">View on Google Business Profile 🔗</a>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/reviews" class="button">Manage More Reviews 📱</a>
          </div>
        </div>

        <div class="footer">
          <p>Great job staying engaged with your customers! 👏</p>
          <p>
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Notification settings</a> |
            <a href="https://support.replifast.com" style="color: #3B82F6;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * Onboarding welcome email template
 */
function onboardingTemplate(data: OnboardingEmailData): EmailTemplate {
  const subject = `Welcome to RepliFast! 🚀 Let's Get Started`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">🚀 RepliFast</h1>
          <p style="color: #E0E7FF; margin: 8px 0 0 0;">Welcome Aboard!</p>
        </div>

        <div class="content">
          <h2>Welcome to RepliFast, ${data.userName}! 🎉</h2>
          <p>Thank you for joining RepliFast! We're excited to help you manage your Google Business Profile reviews with AI-powered efficiency.</p>

          ${data.welcomeMessage ? `
          <div class="card">
            <p style="margin: 0; font-style: italic; color: #374151;">${data.welcomeMessage}</p>
          </div>
          ` : ''}

          <div class="card">
            <h3 style="margin-top: 0;">🎯 Next Steps</h3>
            ${data.nextSteps.map((step, index) => `
              <div style="display: flex; align-items: flex-start; margin: 16px 0; padding: 12px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px;">
                <div style="background-color: #3B82F6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 12px; flex-shrink: 0;">
                  ${index + 1}
                </div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #374151;">${step.title}</h4>
                  <p style="margin: 0; color: #6B7280; font-size: 14px;">${step.description}</p>
                  ${step.actionUrl ? `
                    <a href="${step.actionUrl}" style="color: #3B82F6; text-decoration: none; font-weight: 500; font-size: 14px;">Get Started →</a>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/dashboard" class="button">Go to Dashboard 📊</a>
          </div>

          <div style="background-color: #F0F9FF; border: 1px solid #0EA5E9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0369A1;">💡 Pro Tip</h4>
            <p style="margin: 0; color: #0369A1;">Start by connecting your Google Business Profile to automatically sync your reviews. Our AI will then help you craft perfect responses!</p>
          </div>
        </div>

        <div class="footer">
          <p>Need help getting started? We're here for you! 🤝</p>
          <p>
            <a href="mailto:${data.supportContactEmail}" style="color: #3B82F6;">Contact Support</a> |
            <a href="https://docs.replifast.com" style="color: #3B82F6;">Documentation</a> |
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * Billing notification email template
 */
function billingTemplate(data: BillingEmailData): EmailTemplate {
  const typeMessages = {
    payment_success: { emoji: '✅', title: 'Payment Successful', color: '#10B981' },
    payment_failed: { emoji: '❌', title: 'Payment Failed', color: '#DC2626' },
    subscription_cancelled: { emoji: '⏹️', title: 'Subscription Cancelled', color: '#F59E0B' },
    subscription_reactivated: { emoji: '🔄', title: 'Subscription Reactivated', color: '#10B981' },
    plan_upgraded: { emoji: '⬆️', title: 'Plan Upgraded', color: '#3B82F6' },
    plan_downgraded: { emoji: '⬇️', title: 'Plan Changed', color: '#6B7280' }
  };

  const typeConfig = typeMessages[data.type];
  const subject = `${typeConfig.emoji} ${typeConfig.title} - RepliFast`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">${typeConfig.emoji} RepliFast</h1>
          <p style="color: #E0E7FF; margin: 8px 0 0 0;">Billing Update</p>
        </div>

        <div class="content">
          <h2 style="color: ${typeConfig.color};">${typeConfig.title}</h2>
          <p>Hello ${data.userName}, we have an update regarding your RepliFast subscription.</p>

          <div class="card" style="border-left: 4px solid ${typeConfig.color};">
            <h3 style="margin-top: 0;">💳 Transaction Details</h3>
            ${data.amount ? `
              <div style="margin: 12px 0;">
                <strong>Amount:</strong> ${data.currency?.toUpperCase() || '$'}${data.amount.toFixed(2)}
              </div>
            ` : ''}
            ${data.planName ? `
              <div style="margin: 12px 0;">
                <strong>Plan:</strong> ${data.planName}
              </div>
            ` : ''}
            ${data.nextBillingDate ? `
              <div style="margin: 12px 0;">
                <strong>Next Billing Date:</strong> ${new Date(data.nextBillingDate).toLocaleDateString()}
              </div>
            ` : ''}

            ${data.type === 'payment_success' ? `
              <p style="color: #059669; margin: 16px 0;">
                ✅ Your payment has been processed successfully. Thank you for your continued trust in RepliFast!
              </p>
            ` : ''}

            ${data.type === 'payment_failed' ? `
              <p style="color: #DC2626; margin: 16px 0;">
                ❌ We couldn't process your payment. Please update your payment method to continue using RepliFast.
              </p>
            ` : ''}

            ${data.type === 'subscription_cancelled' ? `
              <p style="color: #F59E0B; margin: 16px 0;">
                We're sorry to see you go! Your subscription has been cancelled but you can still access RepliFast until your current billing period ends.
              </p>
            ` : ''}

            ${data.type === 'subscription_reactivated' ? `
              <p style="color: #059669; margin: 16px 0;">
                🎉 Welcome back! Your subscription has been reactivated and you now have full access to all RepliFast features.
              </p>
            ` : ''}

            ${data.type === 'plan_upgraded' ? `
              <p style="color: #3B82F6; margin: 16px 0;">
                🚀 Congratulations on upgrading! You now have access to enhanced features and capabilities.
              </p>
            ` : ''}
          </div>

          ${data.actionRequired && data.actionMessage ? `
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400E;">⚠️ Action Required</h4>
            <p style="margin: 0; color: #92400E;">${data.actionMessage}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            ${data.invoiceUrl ? `
              <a href="${data.invoiceUrl}" class="button" style="margin-right: 12px;">View Invoice 📄</a>
            ` : ''}
            <a href="https://replifast.com/settings?tab=billing" class="button">Manage Billing ⚙️</a>
          </div>
        </div>

        <div class="footer">
          <p>Questions about your billing? We're here to help! 💬</p>
          <p>
            <a href="mailto:billing@replifast.com" style="color: #3B82F6;">Contact Billing Support</a> |
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Account Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * System alert email template
 */
function systemAlertTemplate(data: SystemAlertData): EmailTemplate {
  const severityConfig = {
    low: { emoji: 'ℹ️', color: '#10B981', bgColor: '#ECFDF5' },
    medium: { emoji: '⚠️', color: '#F59E0B', bgColor: '#FFFBEB' },
    high: { emoji: '🚨', color: '#DC2626', bgColor: '#FEF2F2' },
    critical: { emoji: '🔥', color: '#7C2D12', bgColor: '#FEF2F2' }
  };

  const severity = severityConfig[data.severity];
  const subject = `${severity.emoji} ${data.title} - RepliFast Alert`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">${severity.emoji} RepliFast</h1>
          <p style="color: #E0E7FF; margin: 8px 0 0 0;">System Alert</p>
        </div>

        <div class="content">
          <h2 style="color: ${severity.color};">${data.title}</h2>
          <p>Hello ${data.userName}, we need to inform you about an issue with your RepliFast account.</p>

          <div class="card" style="background-color: ${severity.bgColor}; border-left: 4px solid ${severity.color};">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 24px; margin-right: 12px;">${severity.emoji}</span>
              <div>
                <h3 style="margin: 0; color: ${severity.color};">${data.alertType.replace(/_/g, ' ').toUpperCase()}</h3>
                <span style="background-color: ${severity.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                  ${data.severity} severity
                </span>
              </div>
            </div>

            <p style="margin: 16px 0; color: #374151; font-weight: 500;">${data.message}</p>

            ${data.errorDetails ? `
              <details style="margin: 16px 0;">
                <summary style="cursor: pointer; color: #6B7280; font-size: 14px;">Technical Details</summary>
                <pre style="background-color: #F3F4F6; padding: 12px; border-radius: 4px; font-size: 12px; color: #374151; overflow-x: auto; margin: 8px 0;">${data.errorDetails}</pre>
              </details>
            ` : ''}
          </div>

          ${data.actionRequired ? `
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400E;">⚡ Action Required</h4>
            <p style="margin: 0; color: #92400E;">Please take action to resolve this issue and restore full functionality.</p>
          </div>
          ` : ''}

          ${data.actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" class="button">${data.actionButtonText || 'Resolve Issue'} 🔧</a>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/settings" class="button" style="background-color: #6B7280;">Check Settings ⚙️</a>
          </div>

          <div style="background-color: #F0F9FF; border: 1px solid #0EA5E9; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0369A1;">💡 Need Help?</h4>
            <p style="margin: 0; color: #0369A1;">Our support team is ready to help you resolve this issue quickly. Don't hesitate to reach out!</p>
          </div>
        </div>

        <div class="footer">
          <p>We're monitoring the situation and will keep you updated. 🔍</p>
          <p>
            <a href="mailto:support@replifast.com" style="color: #3B82F6;">Contact Support</a> |
            <a href="https://status.replifast.com" style="color: #3B82F6;">System Status</a> |
            <a href="https://docs.replifast.com" style="color: #3B82F6;">Documentation</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}


/**
 * Automation error email template
 */
function automationErrorTemplate(data: AutomationErrorData): EmailTemplate {
  const subject = `🚨 Automation Error - ${data.errorType}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Automation Error Alert</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);">
          <h1 class="logo">RepliFast 🚨</h1>
          <p style="color: #FEE2E2; margin: 0;">Automation Error Alert</p>
        </div>

        <div class="content">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">Hello ${data.userName},</h2>

          <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; color: #991B1B;">🚨 Automation Error Detected</h3>
            <p style="margin: 0 0 8px 0; color: #991B1B;"><strong>Error Type:</strong> ${data.errorType}</p>
            <p style="margin: 0 0 8px 0; color: #991B1B;"><strong>Time:</strong> ${new Date(data.errorTimestamp).toLocaleString()}</p>
            <p style="margin: 0; color: #991B1B;"><strong>Message:</strong> ${data.errorMessage}</p>
          </div>

          ${data.affectedReviews ? `
          <div class="card">
            <h4 style="margin: 0 0 8px 0; color: #374151;">📊 Impact</h4>
            <p style="margin: 0;">Affected Reviews: <strong>${data.affectedReviews}</strong></p>
            ${data.retryAttempts ? `<p style="margin: 8px 0 0 0;">Retry Attempts: <strong>${data.retryAttempts}</strong></p>` : ''}
          </div>
          ` : ''}

          ${data.requiresAttention ? `
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400E;">⚡ Immediate Attention Required</h4>
            <p style="margin: 0; color: #92400E;">This error requires your immediate attention to restore full automation functionality.</p>
          </div>
          ` : ''}

          ${data.recoveryActions && data.recoveryActions.length > 0 ? `
          <div class="card">
            <h4 style="margin: 0 0 12px 0; color: #374151;">🔧 Recommended Actions</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${data.recoveryActions.map(action => `
                <li style="margin: 8px 0;">
                  <strong>${action.action}:</strong> ${action.description}
                  ${action.url ? `<br><a href="${action.url}" style="color: #3B82F6;">Take Action →</a>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/settings?tab=integrations" class="button" style="background-color: #DC2626;">Check Settings 🔧</a>
          </div>

          <div style="background-color: #F0F9FF; border: 1px solid #0EA5E9; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0369A1;">💡 Need Help?</h4>
            <p style="margin: 0; color: #0369A1;">Our support team is ready to help you resolve this issue quickly. Include this error reference when contacting support.</p>
          </div>
        </div>

        <div class="footer">
          <p>Error detected at ${new Date().toLocaleString()} 🕐</p>
          <p>
            <a href="mailto:support@replifast.com" style="color: #3B82F6;">Contact Support</a> |
            <a href="https://replifast.com/dashboard" style="color: #3B82F6;">Dashboard</a> |
            <a href="https://docs.replifast.com/troubleshooting" style="color: #3B82F6;">Troubleshooting</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * New review alert email template
 */
function newReviewAlertTemplate(data: NewReviewAlertData): EmailTemplate {
  const subject = `⭐ ${data.totalNewReviews} New Review${data.totalNewReviews === 1 ? '' : 's'} for ${data.businessName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Reviews Alert</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">RepliFast ⭐</h1>
          <p style="color: #E0E7FF; margin: 0;">New Reviews Alert</p>
        </div>

        <div class="content">
          <h2 style="color: #1F2937; margin: 0 0 20px 0;">Hello ${data.userName}! 👋</h2>

          <p>Great news! Your business <strong>${data.businessName}</strong> has received ${data.totalNewReviews} new review${data.totalNewReviews === 1 ? '' : 's'}.</p>

          <div class="card">
            <h3 style="margin: 0 0 16px 0; color: #374151;">📊 Summary</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span class="metric">⭐ ${data.totalNewReviews} New Review${data.totalNewReviews === 1 ? '' : 's'}</span>
              <span class="metric">📊 ${data.averageRating.toFixed(1)} Avg Rating</span>
              ${data.automationEnabled ? '<span class="metric" style="background-color: #DCFCE7; border-color: #BBF7D0; color: #166534;">🤖 Automation Active</span>' : '<span class="metric" style="background-color: #FEF3C7; border-color: #FCD34D; color: #92400E;">📝 Manual Review Needed</span>'}
            </div>
          </div>

          ${data.reviews.slice(0, 3).map((review, index) => `
          <div class="card" style="border-left: 4px solid ${review.rating >= 4 ? '#10B981' : review.rating >= 3 ? '#F59E0B' : '#EF4444'};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <strong style="color: #374151;">${review.customerName}</strong>
              <div>
                <span class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                <span style="color: #6B7280; font-size: 12px; margin-left: 8px;">${new Date(review.reviewDate).toLocaleDateString()}</span>
              </div>
            </div>
            <p style="margin: 0 0 12px 0; color: #4B5563; line-height: 1.5;">"${review.text.length > 200 ? review.text.substring(0, 200) + '...' : review.text}"</p>
            ${review.aiReply ? `
            <div style="background-color: #F0F9FF; border: 1px solid #0EA5E9; border-radius: 6px; padding: 12px; margin-top: 12px;">
              <p style="margin: 0; color: #0369A1; font-size: 14px;"><strong>🤖 AI Reply Generated:</strong></p>
              <p style="margin: 4px 0 0 0; color: #0369A1; font-size: 14px;">"${truncateText(review.aiReply, 150)}"</p>
              <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 12px;">Status: <strong>${review.status}</strong></p>
            </div>
            ` : ''}
          </div>
          `).join('')}

          ${data.reviews.length > 3 ? `
          <div style="text-align: center; margin: 20px 0; padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="margin: 0; color: #6B7280;">+ ${data.reviews.length - 3} more review${data.reviews.length - 3 === 1 ? '' : 's'}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" class="button">Manage Reviews 🎯</a>
          </div>

          ${!data.automationEnabled ? `
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400E;">💡 Automate Your Responses</h4>
            <p style="margin: 0; color: #92400E;">Enable automation to automatically generate and post AI replies to new reviews!</p>
            <div style="margin-top: 12px;">
              <a href="https://replifast.com/settings?tab=integrations" style="color: #92400E; text-decoration: underline;">Enable Automation →</a>
            </div>
          </div>
          ` : `
          <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #166534;">🤖 Automation Active</h4>
            <p style="margin: 0; color: #166534;">Your automation system is working to generate and post replies automatically!</p>
          </div>
          `}
        </div>

        <div class="footer">
          <p>Keep engaging with your customers! 🚀</p>
          <p>
            <a href="${data.dashboardUrl}" style="color: #3B82F6;">Dashboard</a> |
            <a href="https://replifast.com/reviews" style="color: #3B82F6;">All Reviews</a> |
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * Automation summary email template (Professional Supabase-style design)
 * Sent when automation successfully posts replies during daily sync
 */
export function automationSummaryTemplate(data: AutomationSummaryData): EmailTemplate {
  // Smart subject line based on what happened
  let subject: string;

  if (data.postedRepliesCount > 0 && data.pendingReviewsCount > 0) {
    // Both posted and pending
    subject = `${data.postedRepliesCount} ${data.postedRepliesCount === 1 ? 'reply' : 'replies'} posted • ${data.pendingReviewsCount} need your review`;
  } else if (data.postedRepliesCount > 0) {
    // Only posted replies
    subject = `${data.postedRepliesCount} ${data.postedRepliesCount === 1 ? 'reply' : 'replies'} posted to your Google Business Profile`;
  } else {
    // Only pending reviews
    subject = `${data.pendingReviewsCount} ${data.pendingReviewsCount === 1 ? 'review needs' : 'reviews need'} your manual approval`;
  }

  // Helper function to generate star rating display
  const generateStarRating = (rating: number): string => {
    const fullStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    return fullStars + emptyStars;
  };

  // Helper function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f8f9fa;
        }
        .email-wrapper {
          padding: 20px 0;
          background-color: #f8f9fa;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          padding: 40px 30px;
          text-align: center;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: rgba(255,255,255,0.9);
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          margin: 0 0 24px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .content p {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #555555;
          line-height: 1.6;
        }
        .metrics-grid {
          display: flex;
          justify-content: space-around;
          gap: 25px;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        .metric-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          flex: 1;
          min-width: 120px;
        }
        .metric-number {
          font-size: 32px;
          font-weight: bold;
          color: #3B82F6;
          display: block;
          margin-bottom: 8px;
        }
        .metric-label {
          font-size: 14px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        .automation-info {
          background: #F0F9FF;
          border: 1px solid #0EA5E9;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .automation-info h3 {
          margin: 0 0 12px 0;
          color: #0369A1;
          font-size: 18px;
        }
        .automation-info p {
          margin: 0;
          color: #0369A1;
          line-height: 1.5;
        }
        .reviews-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .reviews-table th {
          background: #F8FAFC;
          color: #374151;
          font-weight: 600;
          padding: 16px 12px;
          text-align: left;
          border-bottom: 2px solid #E5E7EB;
          font-size: 14px;
        }
        .reviews-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #F3F4F6;
          vertical-align: top;
        }
        .reviews-table tr:nth-child(even) td {
          background-color: #F9FAFB;
        }
        .reviews-table tr:last-child td {
          border-bottom: none;
        }
        .customer-cell {
          font-weight: 600;
          color: #1F2937;
          min-width: 120px;
        }
        .rating-cell {
          color: #F59E0B;
          font-size: 16px;
          min-width: 80px;
        }
        .review-cell {
          color: #4B5563;
          line-height: 1.5;
          max-width: 200px;
        }
        .reply-cell {
          color: #059669;
          line-height: 1.5;
          max-width: 200px;
          font-style: italic;
        }
        .date-cell {
          color: #6B7280;
          font-size: 14px;
          min-width: 70px;
        }
        .table-title {
          color: #1F2937;
          font-size: 20px;
          font-weight: 600;
          margin: 30px 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 600px) {
          .reviews-table, .reviews-table tbody, .reviews-table tr, .reviews-table td {
            display: block;
          }
          .reviews-table thead {
            display: none;
          }
          .reviews-table tr {
            margin-bottom: 16px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 16px;
            background: white;
          }
          .reviews-table td {
            border: none;
            padding: 8px 0;
            position: relative;
            padding-left: 30%;
          }
          .reviews-table td:before {
            content: attr(data-label) ": ";
            position: absolute;
            left: 0;
            width: 28%;
            font-weight: 600;
            color: #374151;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">RepliFast</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${data.businessName}</p>
        </div>

        <div class="content">
          <h2>Automation Summary</h2>
          ${data.postedRepliesCount > 0 && data.pendingReviewsCount > 0 ? `
            <p>Your automated review management has completed. <strong>${data.postedRepliesCount} ${data.postedRepliesCount === 1 ? 'reply has' : 'replies have'} been posted</strong> to your Google Business Profile, and <strong>${data.pendingReviewsCount} ${data.pendingReviewsCount === 1 ? 'review needs' : 'reviews need'} your manual approval</strong>.</p>
          ` : data.postedRepliesCount > 0 ? `
            <p>Your automated review management completed successfully. <strong>${data.postedRepliesCount} ${data.postedRepliesCount === 1 ? 'reply has' : 'replies have'} been posted</strong> to your Google Business Profile.</p>
          ` : `
            <p>Your automated review sync found reviews that need your attention. <strong>${data.pendingReviewsCount} ${data.pendingReviewsCount === 1 ? 'review needs' : 'reviews need'} manual approval</strong> before posting.</p>
          `}

          <div class="metrics-grid">
            ${data.postedRepliesCount > 0 ? `
            <div class="metric-card">
              <span class="metric-number">${data.postedRepliesCount}</span>
              <div class="metric-label">Replies Posted</div>
            </div>
            ` : ''}

            ${data.pendingReviewsCount > 0 ? `
            <div class="metric-card" style="border-left: 3px solid #F59E0B;">
              <span class="metric-number" style="color: #F59E0B;">${data.pendingReviewsCount}</span>
              <div class="metric-label">Need Approval</div>
            </div>
            ` : ''}

            <div class="metric-card">
              <span class="metric-number">${data.automationMetrics.processedReviews}</span>
              <div class="metric-label">Reviews Processed</div>
            </div>
          </div>

          ${data.postedReviews && data.postedReviews.length > 0 ? `
          <h3 class="table-title">Reviews That Received Replies</h3>
          <table class="reviews-table">
            <thead>
              <tr>
                <th style="width: 140px;">Customer</th>
                <th style="width: 45%;">Review</th>
                <th style="width: 45%;">Our Reply</th>
              </tr>
            </thead>
            <tbody>
              ${data.postedReviews.map(review => `
                <tr>
                  <td class="customer-cell" data-label="Customer">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${review.customerName}</div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 4px;">${generateStarRating(review.rating)}</div>
                    <div style="color: #6b7280; font-size: 13px;">${formatDate(review.reviewDate)}</div>
                  </td>
                  <td class="review-cell" data-label="Review">"${truncateText(review.reviewText, 200)}"</td>
                  <td class="reply-cell" data-label="Our Reply">"${truncateText(review.replyText, 200)}"</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          ${data.pendingReviewsCount > 0 ? `
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 16px 0; color: #92400E; font-size: 18px;">⚠️ Manual Review Required</h3>
            <p style="margin: 0 0 20px 0; color: #92400E;">${data.pendingReviewsCount} ${data.pendingReviewsCount === 1 ? 'review needs' : 'reviews need'} your approval before posting${data.approvalMode === 'auto_4_plus' ? ' (due to ratings below 4 stars)' : data.approvalMode === 'auto_except_low' ? ' (due to low ratings)' : ''}:</p>

            <div style="background-color: #FFFBEB; border-radius: 8px; padding: 16px; margin: 16px 0;">
              ${data.pendingReviews.map((review, index) => `
                <div style="border-bottom: ${index < data.pendingReviews.length - 1 ? '1px solid #FDE68A' : 'none'}; padding: ${index > 0 ? '16px 0' : '0 0 16px 0'}; margin: ${index < data.pendingReviews.length - 1 ? '0 0 16px 0' : '0'};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #92400E;">${review.customerName}</strong>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="color: #F59E0B; font-size: 14px;">${generateStarRating(review.rating)}</span>
                      <span style="background-color: ${review.rating >= 4 ? '#DCFCE7' : review.rating >= 3 ? '#FEF3C7' : '#FEE2E2'}; color: ${review.rating >= 4 ? '#166534' : review.rating >= 3 ? '#92400E' : '#991B1B'}; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500;">${review.rating}⭐</span>
                    </div>
                  </div>
                  <div style="background-color: #F9F9F9; border-left: 3px solid #D1D5DB; padding: 10px 12px; margin: 8px 0; border-radius: 0 4px 4px 0;">
                    <p style="margin: 0; color: #4B5563; font-size: 14px; line-height: 1.4; font-style: italic;">"${truncateText(review.reviewText, 150)}"</p>
                  </div>
                  <div style="background-color: #F0F9FF; border-left: 3px solid #0EA5E9; padding: 10px 12px; margin: 8px 0; border-radius: 0 4px 4px 0;">
                    <p style="margin: 0 0 4px 0; color: #0369A1; font-size: 12px; font-weight: 500;">🤖 Suggested Reply:</p>
                    <p style="margin: 0; color: #0369A1; font-size: 14px; line-height: 1.4;">"${truncateText(review.aiReply, 150)}"</p>
                  </div>
                  <div style="text-align: right; margin-top: 8px;">
                    <span style="color: #6B7280; font-size: 12px;">${formatDate(review.reviewDate)}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="text-align: center; margin: 20px 0 0 0;">
              <a href="https://replifast.com/reviews?filter=pending" style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Review Pending Replies →</a>
            </div>
          </div>
          ` : ''}

          ${data.newReviewsCount > 0 ? `
          <div style="background-color: #F0F9FF; border: 1px solid #0EA5E9; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0369A1;">📋 Also Found Today</h4>
            <p style="margin: 0; color: #0369A1;">${data.newReviewsCount} new ${data.newReviewsCount === 1 ? 'review was' : 'reviews were'} discovered during sync</p>
          </div>
          ` : ''}

          <div class="automation-info">
            <h3>🚀 Automation Results</h3>
            <p>Your customers are now seeing thoughtful, personalized responses that match your brand voice. Each reply was automatically generated using AI, approved based on your settings, and posted directly to Google Business Profile.</p>
            <p style="margin-top: 12px;"><strong>Sync completed:</strong> ${new Date(data.syncTimestamp).toLocaleString()} (${data.slotId})</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://replifast.com/dashboard" class="button">📊 View All Reviews & Replies</a>
          </div>

          <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px 0; color: #374151;">⚙️ Automation Details</h4>
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">This summary was generated from your <strong>${data.slotId}</strong> daily automation sync completed at ${new Date(data.syncTimestamp).toLocaleString()}.</p>
            <p style="margin: 0; color: #6B7280; font-size: 14px;">You can adjust your automation settings anytime in your <a href="https://replifast.com/settings?tab=integrations" style="color: #3B82F6;">dashboard settings</a>.</p>
          </div>
        </div>

        <div class="footer">
          <p>Keep growing your business with AI-powered automation! 🚀</p>
          <p>
            <a href="https://replifast.com/reviews" style="color: #3B82F6;">Reviews</a> |
            <a href="https://replifast.com/settings" style="color: #3B82F6;">Settings</a> |
            <a href="https://replifast.com/help" style="color: #3B82F6;">Help</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, htmlContent };
}

/**
 * Get all email templates
 */
export function getEmailTemplates() {
  return {
    digestExport: digestExportTemplate,
    reviewNotification: reviewNotificationTemplate,
    replyConfirmation: replyConfirmationTemplate,
    onboarding: onboardingTemplate,
    billing: billingTemplate,
    systemAlert: systemAlertTemplate,
    automationSummary: automationSummaryTemplate,
    automationError: automationErrorTemplate,
    newReviewAlert: newReviewAlertTemplate
  };
}
