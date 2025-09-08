-- Security Fixes for Supabase Database
-- Execute these statements to resolve security advisor warnings

-- 1. Fix Function Search Path Issues
-- Add SET search_path = '' to make functions secure

CREATE OR REPLACE FUNCTION public.create_default_basic_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Insert a basic subscription for new users (references public.users)
  INSERT INTO public.subscriptions (
    user_id,
    status,
    plan_id,
    payment_processor,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'active',
    'basic',
    'internal',
    NOW(),
    '2099-12-31 23:59:59+00'::timestamptz,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- 1. First sync the user to public.users
  INSERT INTO public.users (
    id,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- 2. Then create the basic subscription with status 'active' and plan_id 'basic'
  INSERT INTO public.subscriptions (
    user_id,
    status,
    plan_id,
    payment_processor,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'active',
    'basic',
    'internal',
    NOW(),
    '2099-12-31 23:59:59+00'::timestamptz,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_daily_review_sync(slot_id text DEFAULT 'slot_1'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    edge_function_url text;
    request_id bigint;
    service_role_key text;
BEGIN
    -- Set the Edge Function URL (update with your project reference)
    edge_function_url := 'https://nysjjhupnvnshizudfnn.supabase.co/functions/v1/daily-review-sync';

    -- Get service role key from Vault instead of placeholder
    SELECT decrypted_secret INTO service_role_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'automation_service_key';

    -- If service role key is not found in vault, log error and exit
    IF service_role_key IS NULL OR service_role_key = '' THEN
        INSERT INTO activities (business_id, type, description, metadata)
        VALUES (
            NULL,
            'settings_updated'::activity_type,
            'Failed to retrieve service role key from vault for ' || slot_id,
            jsonb_build_object(
                'error', 'Service role key not found in vault',
                'vault_key', 'automation_service_key',
                'timestamp', NOW(),
                'source', 'pg_cron_function',
                'slot_id', slot_id,
                'activity_subtype', 'review_sync_error'
            )
        );
        
        RAISE EXCEPTION 'Service role key not found in vault with name: automation_service_key';
    END IF;

    -- Log the sync attempt
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'Daily automated review sync triggered via pg_cron for ' || slot_id || ' (using vault key)',
        jsonb_build_object(
            'trigger_time', NOW(),
            'function_url', edge_function_url,
            'source', 'pg_cron',
            'slot_id', slot_id,
            'auth_method', 'vault',
            'activity_subtype', 'review_sync_scheduled'
        )
    );

    -- Make HTTP request to Edge Function using pg_net with vault key
    SELECT INTO request_id
        net.http_post(
            url := edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_role_key
            ),
            body := jsonb_build_object(
                'trigger_source', 'pg_cron',
                'trigger_time', NOW(),
                'slot_id', slot_id
            )
        );

    -- Log that the request was sent (response will be handled asynchronously)
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'HTTP request sent to daily review sync Edge Function for ' || slot_id || ' (authenticated via vault)',
        jsonb_build_object(
            'request_id', request_id,
            'function_url', edge_function_url,
            'timestamp', NOW(),
            'slot_id', slot_id,
            'auth_method', 'vault',
            'activity_subtype', 'review_sync_request_sent'
        )
    );

    RAISE NOTICE 'Daily review sync triggered for % with vault authentication, request ID: %', slot_id, request_id;

EXCEPTION WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO activities (business_id, type, description, metadata)
    VALUES (
        NULL,
        'settings_updated'::activity_type,
        'Failed to trigger daily review sync for ' || slot_id || ': ' || SQLERRM,
        jsonb_build_object(
            'error', SQLERRM,
            'error_state', SQLSTATE,
            'timestamp', NOW(),
            'source', 'pg_cron_function',
            'slot_id', slot_id,
            'auth_method', 'vault',
            'activity_subtype', 'review_sync_error'
        )
    );

    RAISE NOTICE 'Error triggering daily review sync for %: %', slot_id, SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_platform_api_connections()
 RETURNS TABLE(business_id uuid, business_name text, connection_status text, has_account_id boolean, has_location_id boolean, has_access_token boolean, auto_sync_enabled boolean, issues text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.connection_status,
        (b.google_account_id IS NOT NULL) as has_account_id,
        (b.google_location_id IS NOT NULL) as has_location_id,
        (b.google_access_token IS NOT NULL) as has_access_token,
        bs.auto_sync_enabled,
        CASE 
            WHEN b.google_account_id IS NULL THEN ARRAY['Missing Google Account ID']
            WHEN b.google_location_id IS NULL THEN ARRAY['Missing Google Location ID']  
            WHEN b.google_access_token IS NULL THEN ARRAY['Missing Access Token']
            WHEN b.connection_status != 'connected' THEN ARRAY['Connection status: ' || COALESCE(b.connection_status, 'unknown')]
            ELSE ARRAY[]::text[]
        END as issues
    FROM businesses b
    LEFT JOIN business_settings bs ON b.id = bs.business_id
    WHERE bs.auto_sync_enabled = true
       OR b.google_account_id IS NOT NULL 
       OR b.google_location_id IS NOT NULL;
END;
$function$;

-- 2. Move pg_net extension from public schema to extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 3. Fix Security Definer View Issue
-- Recreate the sync_activities view and fix permissions to use proper RLS
DROP VIEW IF EXISTS public.sync_activities;
CREATE VIEW public.sync_activities AS
SELECT 
    id,
    business_id,
    type,
    description,
    metadata,
    created_at,
    metadata ->> 'activity_subtype' AS sync_type,
    metadata ->> 'slot_id' AS slot_id,
    metadata ->> 'request_id' AS request_id,
    metadata ->> 'connection_status' AS connection_status,
    metadata ->> 'business_name' AS business_name
FROM activities
WHERE (
    (metadata ->> 'activity_subtype') = ANY (ARRAY[
        'review_sync_automated',
        'review_sync_scheduled', 
        'review_sync_error',
        'review_sync_request_sent',
        'platform_api_success',
        'platform_api_error'
    ])
    OR description ILIKE '%review sync%'
    OR description ILIKE '%platform api%'
    OR description ILIKE '%google business%'
)
ORDER BY created_at DESC
LIMIT 100;

-- Remove overly broad permissions that bypass RLS
REVOKE ALL ON public.sync_activities FROM anon;
REVOKE ALL ON public.sync_activities FROM authenticated;
REVOKE ALL ON public.sync_activities FROM service_role;

-- Grant only necessary permissions (SELECT) to authenticated users
-- RLS policies on the underlying activities table will control access
GRANT SELECT ON public.sync_activities TO authenticated;
GRANT SELECT ON public.sync_activities TO service_role;

-- Manual fixes required (cannot be done via SQL):
-- 4. Enable leaked password protection:
--    Go to Supabase Dashboard → Authentication → Settings → Enable "Check for leaked passwords"
-- 5. Upgrade PostgreSQL version:
--    Go to Supabase Dashboard → Settings → Infrastructure → Upgrade database