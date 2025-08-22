-- Stripe Subscription Cleanup Script
-- This script identifies and cleans up duplicate subscriptions
-- Run during a maintenance window for safety

-- Step 1: Identify duplicate subscriptions per user
WITH duplicate_subscriptions AS (
  SELECT 
    user_id,
    COUNT(*) as subscription_count,
    ARRAY_AGG(
      JSON_BUILD_OBJECT(
        'id', id,
        'stripe_subscription_id', stripe_subscription_id,
        'status', status,
        'cancel_at_period_end', cancel_at_period_end,
        'current_period_end', current_period_end,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as subscriptions
  FROM subscriptions 
  WHERE status = 'active'
  GROUP BY user_id
  HAVING COUNT(*) > 1
),

-- Step 2: Determine which subscriptions to keep vs supersede
subscription_actions AS (
  SELECT 
    user_id,
    subscription_count,
    subscriptions,
    -- Keep the newest subscription that is not marked for cancellation
    (
      SELECT sub ->> 'id' 
      FROM unnest(subscriptions) as sub
      WHERE (sub ->> 'cancel_at_period_end')::boolean = false
      ORDER BY (sub ->> 'created_at')::timestamp DESC
      LIMIT 1
    ) as subscription_to_keep,
    -- Mark older subscriptions or cancelled ones as superseded
    (
      SELECT ARRAY_AGG(sub ->> 'id')
      FROM unnest(subscriptions) as sub
      WHERE (sub ->> 'id') != (
        SELECT sub2 ->> 'id' 
        FROM unnest(subscriptions) as sub2
        WHERE (sub2 ->> 'cancel_at_period_end')::boolean = false
        ORDER BY (sub2 ->> 'created_at')::timestamp DESC
        LIMIT 1
      )
    ) as subscriptions_to_supersede
  FROM duplicate_subscriptions
)

-- Step 3: Show the cleanup plan (run this first to review)
SELECT 
  user_id,
  subscription_count,
  subscription_to_keep,
  array_length(subscriptions_to_supersede, 1) as subscriptions_to_supersede_count,
  subscriptions_to_supersede,
  subscriptions
FROM subscription_actions
ORDER BY subscription_count DESC, user_id;

-- IMPORTANT: Review the above results before executing the cleanup!

-- Step 4: Execute the cleanup (uncomment when ready)
/*
WITH duplicate_subscriptions AS (
  SELECT 
    user_id,
    COUNT(*) as subscription_count,
    ARRAY_AGG(
      JSON_BUILD_OBJECT(
        'id', id,
        'stripe_subscription_id', stripe_subscription_id,
        'status', status,
        'cancel_at_period_end', cancel_at_period_end,
        'current_period_end', current_period_end,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as subscriptions
  FROM subscriptions 
  WHERE status = 'active'
  GROUP BY user_id
  HAVING COUNT(*) > 1
),

subscription_actions AS (
  SELECT 
    user_id,
    subscription_count,
    subscriptions,
    (
      SELECT sub ->> 'id' 
      FROM unnest(subscriptions) as sub
      WHERE (sub ->> 'cancel_at_period_end')::boolean = false
      ORDER BY (sub ->> 'created_at')::timestamp DESC
      LIMIT 1
    ) as subscription_to_keep,
    (
      SELECT ARRAY_AGG(sub ->> 'id')
      FROM unnest(subscriptions) as sub
      WHERE (sub ->> 'id') != (
        SELECT sub2 ->> 'id' 
        FROM unnest(subscriptions) as sub2
        WHERE (sub2 ->> 'cancel_at_period_end')::boolean = false
        ORDER BY (sub2 ->> 'created_at')::timestamp DESC
        LIMIT 1
      )
    ) as subscriptions_to_supersede
  FROM duplicate_subscriptions
),

cleanup_operations AS (
  SELECT 
    sa.subscription_to_keep,
    unnest(sa.subscriptions_to_supersede) as subscription_to_supersede
  FROM subscription_actions sa
  WHERE sa.subscription_to_keep IS NOT NULL
    AND sa.subscriptions_to_supersede IS NOT NULL
)

-- Mark superseded subscriptions
UPDATE subscriptions 
SET 
  superseded_by = co.subscription_to_keep,
  replacement_reason = 'duplicate_cleanup_' || EXTRACT(epoch FROM NOW())::text,
  updated_at = NOW()
FROM cleanup_operations co
WHERE subscriptions.id::text = co.subscription_to_supersede
  AND superseded_by IS NULL; -- Only update if not already superseded

-- Log the cleanup actions
INSERT INTO activities (business_id, type, description, metadata)
SELECT 
  b.id as business_id,
  'subscription_cleanup'::activity_type,
  'Cleaned up duplicate subscriptions during maintenance',
  JSON_BUILD_OBJECT(
    'cleanup_timestamp', NOW(),
    'subscription_kept', sa.subscription_to_keep,
    'subscriptions_superseded', sa.subscriptions_to_supersede,
    'subscription_count', sa.subscription_count
  )
FROM subscription_actions sa
JOIN subscriptions s ON s.id::text = sa.subscription_to_keep
JOIN businesses b ON b.user_id = s.user_id
WHERE sa.subscription_to_keep IS NOT NULL;
*/

-- Step 5: Verify the cleanup results
/*
SELECT 
  'After cleanup - Active subscriptions per user' as check_type,
  user_id,
  COUNT(*) as active_subscriptions,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'stripe_subscription_id', stripe_subscription_id,
      'cancel_at_period_end', cancel_at_period_end,
      'superseded_by', superseded_by,
      'replacement_reason', replacement_reason
    )
  ) as subscription_details
FROM subscriptions 
WHERE status = 'active'
GROUP BY user_id
ORDER BY active_subscriptions DESC;
*/

-- Step 6: Final consistency check
/*
SELECT 
  'Users with multiple active non-cancelled subscriptions (should be 0)' as final_check,
  COUNT(*) as problem_users
FROM (
  SELECT user_id
  FROM subscriptions 
  WHERE status = 'active' 
    AND cancel_at_period_end = false
    AND superseded_by IS NULL
  GROUP BY user_id
  HAVING COUNT(*) > 1
) problem_users;
*/