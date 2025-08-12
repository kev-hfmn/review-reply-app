-- Add trial subscription for your user
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users

-- First, get your user ID by running:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert a trial subscription
INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    price_id,
    cancel_at_period_end,
    current_period_end,
    created_at,
    updated_at
) VALUES (
    '9c6d0dc9-8853-4656-8b2b-d2dc88e2df49', -- Replace with your user ID
    'cus_test_' || gen_random_uuid()::text, -- Mock Stripe customer ID
    'sub_test_' || gen_random_uuid()::text, -- Mock Stripe subscription ID
    'trialing', -- Trial status
    'price_test_trial', -- Mock price ID
    false, -- Not cancelled
    NOW() + INTERVAL '30 days', -- Trial for 30 days
    NOW(),
    NOW()
);

-- Or alternatively, add an active subscription:
-- INSERT INTO subscriptions (
--     user_id,
--     stripe_customer_id, 
--     stripe_subscription_id,
--     status,
--     price_id,
--     cancel_at_period_end,
--     current_period_end,
--     created_at,
--     updated_at
-- ) VALUES (
--     '9c6d0dc9-8853-4656-8b2b-d2dc88e2df49', -- Replace with your user ID
--     'cus_test_' || gen_random_uuid()::text,
--     'sub_test_' || gen_random_uuid()::text,
--     'active', -- Active subscription
--     'price_test_premium',
--     false,
--     NOW() + INTERVAL '1 month', -- Active for 1 month
--     NOW(),
--     NOW()
-- );