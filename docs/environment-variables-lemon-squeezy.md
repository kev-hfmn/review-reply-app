# Environment Variables for Lemon Squeezy Migration

This document outlines all the environment variables required for the Lemon Squeezy integration alongside the existing Stripe setup.

## Required Environment Variables

### Lemon Squeezy Configuration

Add these variables to your `.env.local` file:

```env
# Lemon Squeezy API Configuration
LEMONSQUEEZY_API_KEY=your_lemon_squeezy_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here

# Lemon Squeezy Product Variant IDs (get these from your Lemon Squeezy dashboard)
NEXT_PUBLIC_LEMONSQUEEZY_STARTER_VARIANT_ID=12345
NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID=12346
NEXT_PUBLIC_LEMONSQUEEZY_PRO_PLUS_VARIANT_ID=12347

# Feature Flag - Controls which payment processor to use
NEXT_PUBLIC_USE_LEMON_SQUEEZY=false  # Set to 'true' to enable Lemon Squeezy
```

### Existing Stripe Configuration (Keep During Migration)

```env
# Stripe Configuration (keep these during migration)
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key

# Stripe Price IDs (keep these for backward compatibility)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_existing_starter
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_existing_pro
NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID=price_existing_pro_plus
```

### Other Required Environment Variables

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Update for production

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Other existing environment variables...
```

## How to Get Lemon Squeezy Values

### 1. API Key
1. Log into your Lemon Squeezy dashboard
2. Go to Settings > API
3. Create a new API key or use an existing one
4. Copy the key to `LEMONSQUEEZY_API_KEY`

### 2. Store ID
1. In your Lemon Squeezy dashboard, go to Settings > General
2. Your Store ID is displayed in the URL or settings
3. Copy the numeric ID to `LEMONSQUEEZY_STORE_ID`

### 3. Webhook Secret
1. Go to Settings > Webhooks in your Lemon Squeezy dashboard
2. Create a new webhook pointing to: `https://yourdomain.com/api/lemonsqueezy/webhook`
3. Copy the signing secret to `LEMONSQUEEZY_WEBHOOK_SECRET`

### 4. Product Variant IDs
1. Go to Products in your Lemon Squeezy dashboard
2. Create products that match your current Stripe pricing:
   - Starter Plan ($19/month)
   - Pro Plan ($49/month)
   - Pro Plus Plan (+$19/month per location)
3. For each product, copy the Variant ID to the corresponding environment variable

## Feature Flag Usage

The `NEXT_PUBLIC_USE_LEMON_SQUEEZY` environment variable controls which payment processor is used:

- `false` (default): Uses Stripe for all new subscriptions
- `true`: Uses Lemon Squeezy for all new subscriptions

**Migration Strategy:**
1. Deploy with `NEXT_PUBLIC_USE_LEMON_SQUEEZY=false`
2. Test the integration in development
3. Enable `NEXT_PUBLIC_USE_LEMON_SQUEEZY=true` for production migration

## Webhook Endpoints

Make sure to configure webhooks in both systems:

### Stripe Webhooks (existing)
- Endpoint: `https://yourdomain.com/api/stripe/webhook`
- Events: `customer.subscription.*`, `checkout.session.completed`, `invoice.*`

### Lemon Squeezy Webhooks (new)
- Endpoint: `https://yourdomain.com/api/lemonsqueezy/webhook`
- Events: All subscription and order events (recommended)

## Security Notes

1. **Never commit sensitive keys** to version control
2. **Use different keys** for development and production
3. **Rotate API keys regularly** for security
4. **Validate webhook signatures** (handled automatically by the integration)

## Migration Checklist

- [ ] Add all Lemon Squeezy environment variables
- [ ] Create products in Lemon Squeezy dashboard
- [ ] Configure webhook endpoint
- [ ] Test with feature flag disabled (`NEXT_PUBLIC_USE_LEMON_SQUEEZY=false`)
- [ ] Test webhook processing in development
- [ ] Enable feature flag for production (`NEXT_PUBLIC_USE_LEMON_SQUEEZY=true`)
- [ ] Monitor subscription creation and webhook processing
- [ ] After successful migration, optionally remove Stripe variables

## Troubleshooting

### Common Issues

1. **Invalid API Key Error**
   - Verify `LEMONSQUEEZY_API_KEY` is correct
   - Check that the API key has the necessary permissions

2. **Webhook Signature Validation Failed**
   - Ensure `LEMONSQUEEZY_WEBHOOK_SECRET` matches your webhook configuration
   - Verify the webhook endpoint URL is correct

3. **Variant ID Not Found**
   - Check that product variant IDs are correct
   - Ensure products are active in your Lemon Squeezy store

4. **Feature Flag Not Working**
   - Environment variables starting with `NEXT_PUBLIC_` require a rebuild
   - Restart your development server after adding new variables

### Debug Mode

To enable debug logging, you can temporarily add:

```env
NODE_ENV=development
```

This will show additional console logs for troubleshooting webhook processing and subscription management.