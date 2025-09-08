# Supabase Authentication Email Templates

Professional HTML email templates for RepliFast authentication flows, optimized for deliverability and spam compliance.

## Template Variables Available

- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .Token }}` - 6-digit OTP code
- `{{ .TokenHash }}` - Hashed token for custom URLs
- `{{ .SiteURL }}` - Application site URL
- `{{ .RedirectTo }}` - Redirect URL after action
- `{{ .Email }}` - User's current email
- `{{ .NewEmail }}` - New email address (for email change)
- `{{ .Data }}` - User metadata

---

## 1. Confirm Signup Template

**Subject:** `Confirm your RepliFast account`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Account</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 48px; height: 48px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
        .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .button:hover { background: linear-gradient(135deg, #003d7a 0%, #002d5a 100%); }
        .otp-code { background-color: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
        .otp-code .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; }
        .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
        .footer a { color: #004d99; text-decoration: none; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .security-notice p { color: #92400e; margin: 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.replifast.com/_next/image?url=%2Ficons%2Ficon.png&w=96&q=75" alt="RepliFast" class="logo">
            <h1>Welcome to RepliFast</h1>
        </div>

        <div class="content">
            <h2>Confirm your account</h2>
            <p>Thank you for signing up for RepliFast. To complete your registration and start managing your Google reviews with AI-powered responses, please confirm your email address.</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            </p>

            <div class="otp-code">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Or enter this verification code:</p>
                <div class="code">{{ .Token }}</div>
            </div>

            <div class="security-notice">
                <p><strong>Security Notice:</strong> This link will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2025 RepliFast by Soulrise LLC. This is an automated message from our authentication system.</p>
            <p><a href="https://www.replifast.com">Visit RepliFast</a></p>
        </div>
    </div>
</body>
</html>
```

---

## 2. Magic Link Template

**Subject:** `Your RepliFast sign-in link`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In to RepliFast</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 48px; height: 48px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
        .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .otp-code { background-color: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
        .otp-code .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; }
        .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
        .footer a { color: #004d99; text-decoration: none; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .security-notice p { color: #92400e; margin: 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.replifast.com/_next/image?url=%2Ficons%2Ficon.png&w=96&q=75" alt="RepliFast" class="logo">
            <h1>Sign in to RepliFast</h1>
        </div>

        <div class="content">
            <h2>Your secure sign-in link</h2>
            <p>Click the button below to securely sign in to your RepliFast account. No password required.</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Sign In to RepliFast</a>
            </p>

            <div class="otp-code">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Or enter this verification code:</p>
                <div class="code">{{ .Token }}</div>
            </div>

            <div class="security-notice">
                <p><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this sign-in link, please ignore this email.</p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2025 RepliFast by Soulrise LLC. This is an automated message from our authentication system.</p>
            <p><a href="https://www.replifast.com">Visit RepliFast</a></p>
        </div>
    </div>
</body>
</html>
```

---

## 3. Invite User Template

**Subject:** `You're invited to join RepliFast`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to RepliFast</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 48px; height: 48px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
        .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .otp-code { background-color: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
        .otp-code .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; }
        .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
        .footer a { color: #004d99; text-decoration: none; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .security-notice p { color: #92400e; margin: 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.replifast.com/_next/image?url=%2Ficons%2Ficon.png&w=96&q=75" alt="RepliFast" class="logo">
            <h1>You're Invited!</h1>
        </div>

        <div class="content">
            <h2>Join RepliFast</h2>
            <p>You've been invited to join RepliFast, the AI-powered platform for managing Google Business Profile reviews. Accept this invitation to start automating your review responses.</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Accept Invitation</a>
            </p>

            <div class="otp-code">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Or enter this verification code:</p>
                <div class="code">{{ .Token }}</div>
            </div>

            <div class="security-notice">
                <p><strong>Security Notice:</strong> This invitation will expire in 7 days. If you weren't expecting this invitation, please ignore this email.</p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2025 RepliFast by Soulrise LLC. This is an automated message from our authentication system.</p>
            <p><a href="https://www.replifast.com">Visit RepliFast</a></p>
        </div>
    </div>
</body>
</html>
```

---

## 4. Change Email Address Template

**Subject:** `Confirm your email address change`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email Change</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 48px; height: 48px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
        .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .otp-code { background-color: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
        .otp-code .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; }
        .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
        .footer a { color: #004d99; text-decoration: none; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .security-notice p { color: #92400e; margin: 0; font-size: 14px; }
        .email-change { background-color: #eff6ff; border: 1px solid #dbeafe; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .email-change p { color: #1e40af; margin: 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.replifast.com/_next/image?url=%2Ficons%2Ficon.png&w=96&q=75" alt="RepliFast" class="logo">
            <h1>Email Change Request</h1>
        </div>

        <div class="content">
            <h2>Confirm email address change</h2>
            <p>You've requested to change your email address for your RepliFast account. Please confirm this change to complete the process.</p>

            <div class="email-change">
                <p><strong>Current email:</strong> {{ .Email }}</p>
                <p><strong>New email:</strong> {{ .NewEmail }}</p>
            </div>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Change</a>
            </p>

            <div class="otp-code">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Or enter this verification code:</p>
                <div class="code">{{ .Token }}</div>
            </div>

            <div class="security-notice">
                <p><strong>Security Notice:</strong> This link will expire in 24 hours. If you didn't request this email change, please contact support immediately.</p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2025 RepliFast by Soulrise LLC. This is an automated message from our authentication system.</p>
            <p><a href="https://www.replifast.com">Visit RepliFast</a></p>
        </div>
    </div>
</body>
</html>
```

---

## 5. Password Reset/Recovery Template

**Subject:** `Reset your RepliFast password`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 48px; height: 48px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
        .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .otp-code { background-color: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
        .otp-code .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; }
        .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
        .footer a { color: #004d99; text-decoration: none; }
        .security-notice { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .security-notice p { color: #991b1b; margin: 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.replifast.com/_next/image?url=%2Ficons%2Ficon.png&w=96&q=75" alt="RepliFast" class="logo">
            <h1>Password Reset</h1>
        </div>

        <div class="content">
            <h2>Reset your password</h2>
            <p>You've requested to reset your password for your RepliFast account. Click the button below to create a new password.</p>

            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            </p>

            <div class="otp-code">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Or enter this verification code:</p>
                <div class="code">{{ .Token }}</div>
            </div>

            <div class="security-notice">
                <p><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2025 RepliFast by Soulrise LLC. This is an automated message from our authentication system.</p>
            <p><a href="https://www.replifast.com">Visit RepliFast</a></p>
        </div>
    </div>
</body>
</html>
```

---

## 6. Reauthentication Template

**Subject:** `Confirm your identity`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Identity</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #004d99 0%, #003d7a 100%); padding: 40px 20px; text-align: center; }
        .logo { width: 48px; height: 48px; margin-bottom: 16px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; }
        .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
        .otp-code { background-color: #f3f4f6; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0; }
        .otp-code .code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; }
        .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
        .footer a { color: #004d99; text-decoration: none; }
        .security-notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .security-notice p { color: #92400e; margin: 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.replifast.com/_next/image?url=%2Ficons%2Ficon.png&w=96&q=75" alt="RepliFast" class="logo">
            <h1>Identity Confirmation</h1>
        </div>

        <div class="content">
            <h2>Confirm your identity</h2>
            <p>For your security, we need to confirm your identity before proceeding with this sensitive action on your RepliFast account.</p>

            <div class="otp-code">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Enter this verification code:</p>
                <div class="code">{{ .Token }}</div>
            </div>

            <div class="security-notice">
                <p><strong>Security Notice:</strong> This code will expire in 10 minutes. If you didn't initiate this action, please contact support immediately.</p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2025 RepliFast by Soulrise LLC. This is an automated message from our authentication system.</p>
            <p><a href="https://www.replifast.com">Visit RepliFast</a></p>
        </div>
    </div>
</body>
</html>
```

---

## Brand Consistency Applied

### Consistent Colors Throughout:
- **All headers and buttons**: `#004d99` → `#003d7a` (your primary brand colors)
- **No more random colors** - consistent branding across all email types
- **Footer links**: Use primary brand color for consistency

### Updated Footer Branding:
- **Copyright**: &copy; 2025 RepliFast by Soulrise LLC
- **Platform link**: Direct link to `https://www.replifast.com`
- **Consistent styling** across all templates

### Professional Consistency:
- Same gradient and hover effects throughout
- Unified color scheme maintains brand recognition
- All templates now follow identical styling patterns

## Anti-Spam Best Practices Implemented

### 1. **Technical Compliance**
- Proper HTML structure with DOCTYPE and meta tags
- Inline CSS to avoid external dependencies
- Mobile-responsive design with viewport meta tag
- Alt text for images for accessibility

### 2. **Content Guidelines**
- Clear, focused subject lines without promotional language
- Minimal promotional content - purely transactional
- Consistent branding without marketing taglines
- Short, direct messaging focused on the authentication action
- No user-generated content that could trigger spam filters

### 3. **Security Features**
- Clear expiration times for all links/codes
- Security notices explaining what to do if email wasn't requested
- Both link and OTP code options for accessibility
- Professional, trustworthy design

### 4. **Deliverability Optimization**
- Proper sender authentication (requires custom SMTP setup)
- Consistent From address and domain
- No suspicious keywords or excessive capitalization
- Balanced text-to-image ratio
- Professional color scheme and typography

### 5. **Template Structure**
- Consistent layout across all templates
- Clear call-to-action buttons
- Professional footer with company information
- Unified color scheme for brand recognition

## Implementation Notes

1. **Custom SMTP Required**: Set up custom SMTP (Resend, SendGrid, etc.) for production
2. **Rate Limiting**: Configure appropriate rate limits in Supabase Auth settings
3. **Domain Authentication**: Set up DKIM, DMARC, and SPF records
4. **Testing**: Test with team members before production deployment
5. **Monitoring**: Monitor delivery rates and spam complaints

These templates follow Supabase's documentation recommendations and industry best practices for transactional email deliverability.
