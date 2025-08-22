-- Migration: Platform-Wide Google OAuth Integration
-- Description: Migrate from user-supplied credentials to platform-wide OAuth
-- Date: 2025-01-21
-- Author: Claude Code

-- This migration removes user-supplied credential fields and adds platform-specific tracking

BEGIN;

-- Step 1: Remove user-supplied credential fields
-- These fields will no longer be needed as we move to platform OAuth

ALTER TABLE businesses DROP COLUMN IF EXISTS google_client_id;
ALTER TABLE businesses DROP COLUMN IF EXISTS google_client_secret;

-- Step 2: Add platform-specific fields for better business tracking and connection management

-- Add google_account_name to store the user's Google account name/email
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_account_name TEXT;

-- Add google_business_name to store the actual business name from Google Business Profile
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_business_name TEXT;

-- Add google_location_name to store the location name for multi-location businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_location_name TEXT;

-- Add connection_status to track the current OAuth connection state
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';

-- Add last_connection_attempt to track when we last attempted to connect
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_connection_attempt TIMESTAMP WITH TIME ZONE;

-- Step 3: Update existing businesses that have active connections
-- Mark them as needing reconnection since we're changing the OAuth system

UPDATE businesses 
SET connection_status = 'needs_reconnection'
WHERE google_access_token IS NOT NULL 
   OR google_refresh_token IS NOT NULL 
   OR google_account_id IS NOT NULL;

-- Step 4: Verify existing required fields are present
-- These fields should already exist from the original implementation

DO $$
BEGIN
    -- Check if required fields exist, if not add them
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'google_access_token') THEN
        ALTER TABLE businesses ADD COLUMN google_access_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'google_refresh_token') THEN
        ALTER TABLE businesses ADD COLUMN google_refresh_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'google_account_id') THEN
        ALTER TABLE businesses ADD COLUMN google_account_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'google_location_id') THEN
        ALTER TABLE businesses ADD COLUMN google_location_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'last_review_sync') THEN
        ALTER TABLE businesses ADD COLUMN last_review_sync TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' AND column_name = 'initial_backfill_complete') THEN
        ALTER TABLE businesses ADD COLUMN initial_backfill_complete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 5: Add helpful indexes for the new fields

CREATE INDEX IF NOT EXISTS idx_businesses_connection_status ON businesses(connection_status);
CREATE INDEX IF NOT EXISTS idx_businesses_google_account_name ON businesses(google_account_name);
CREATE INDEX IF NOT EXISTS idx_businesses_last_connection_attempt ON businesses(last_connection_attempt);

-- Step 6: Log the migration completion

INSERT INTO activities (business_id, type, description, metadata, created_at)
SELECT 
    id as business_id,
    'settings_updated' as type,
    'Migrated to platform-wide Google OAuth system' as description,
    jsonb_build_object(
        'migration', 'platform_oauth',
        'previous_connection_method', 'user_credentials',
        'new_connection_method', 'platform_oauth',
        'requires_reconnection', true,
        'migration_date', NOW()::text
    ) as metadata,
    NOW() as created_at
FROM businesses
WHERE google_access_token IS NOT NULL 
   OR google_refresh_token IS NOT NULL 
   OR google_account_id IS NOT NULL;

COMMIT;

-- Post-migration verification queries
-- Run these after migration to verify success:

/*
-- Verify schema changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN (
    'google_account_name', 
    'google_business_name', 
    'google_location_name', 
    'connection_status', 
    'last_connection_attempt'
)
ORDER BY column_name;

-- Check connection status distribution
SELECT connection_status, COUNT(*) 
FROM businesses 
GROUP BY connection_status;

-- Verify old credential fields are removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN ('google_client_id', 'google_client_secret');
-- Should return empty result set

-- Check migration activities logged
SELECT type, description, COUNT(*)
FROM activities 
WHERE type = 'settings_updated' 
AND description LIKE '%platform-wide Google OAuth%'
GROUP BY type, description;
*/