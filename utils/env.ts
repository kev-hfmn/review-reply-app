export function validateEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_BUTTON_ID',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'CREDENTIALS_ENCRYPTION_KEY',
    'BREVO_API_KEY',
  ];

  const optionalEnvVars = [
    'BREVO_SENDER_EMAIL',
    'BREVO_SENDER_NAME',
    'BREVO_REPLY_TO_EMAIL',
    'BREVO_REPLY_TO_NAME',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate Brevo configuration
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@replifast.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'RepliFast';
    
    console.log('✅ Environment validation: Brevo email configuration loaded', {
      senderEmail,
      senderName,
      hasReplyTo: !!process.env.BREVO_REPLY_TO_EMAIL
    });
  }
} 