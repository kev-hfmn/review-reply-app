-- =====================================================
-- SECURITY FIX BACKUP & ROLLBACK SQL COMMANDS
-- =====================================================
-- Date: 2025-08-28
-- Purpose: Backup current state and provide rollback commands for security fixes
-- Usage: Execute these commands to revert security changes if needed
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP CURRENT STATE (RUN BEFORE MAKING CHANGES)
-- =====================================================

-- Backup current RLS policies
-- This will generate the CREATE POLICY statements to restore current policies
SELECT 
    'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename || 
    ' FOR ' || cmd || ' TO ' || array_to_string(roles, ', ') ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';' AS backup_policy
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Backup current RLS status
SELECT 
    'ALTER TABLE ' || schemaname || '.' || tablename || 
    CASE WHEN rowsecurity THEN ' ENABLE ROW LEVEL SECURITY;' ELSE ' DISABLE ROW LEVEL SECURITY;' END AS backup_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Backup current function definitions (for search_path changes)
SELECT 
    'CREATE OR REPLACE FUNCTION ' || schemaname || '.' || routinename || 
    '(' || COALESCE(string_agg(parameter_name || ' ' || data_type, ', '), '') || ') ' ||
    'RETURNS ' || data_type || ' AS $$ ' || routine_definition || ' $$;' AS backup_function
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.schemaname = 'public' 
AND r.routine_type = 'FUNCTION'
GROUP BY r.schemaname, r.routinename, r.data_type, r.routine_definition
ORDER BY r.routinename;

-- Backup current view definitions (for SECURITY DEFINER changes)
SELECT 
    'CREATE OR REPLACE VIEW ' || schemaname || '.' || viewname || ' AS ' || definition AS backup_view
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('scheduled_jobs', 'sync_activities')
ORDER BY viewname;

-- =====================================================
-- ROLLBACK COMMANDS FOR PHASE 1: CRITICAL SECURITY FIXES
-- =====================================================

-- Rollback webhook_events_processed RLS changes
-- WARNING: This will disable RLS protection on webhook_events_processed table
DROP POLICY IF EXISTS "Service role webhook access" ON webhook_events_processed;
ALTER TABLE webhook_events_processed DISABLE ROW LEVEL SECURITY;

-- Rollback SECURITY DEFINER view changes
-- Note: You'll need to restore the original view definitions
-- Replace [ORIGINAL_VIEW_DEFINITION] with the actual view definition from backup

-- For scheduled_jobs view:
DROP VIEW IF EXISTS public.scheduled_jobs;
-- CREATE OR REPLACE VIEW public.scheduled_jobs WITH (security_definer=true) AS 
-- [ORIGINAL_VIEW_DEFINITION]; -- Replace with actual definition from backup

-- For sync_activities view:
DROP VIEW IF EXISTS public.sync_activities;
-- CREATE OR REPLACE VIEW public.sync_activities WITH (security_definer=true) AS 
-- [ORIGINAL_VIEW_DEFINITION]; -- Replace with actual definition from backup

-- =====================================================
-- ROLLBACK COMMANDS FOR PHASE 2: RLS PERFORMANCE OPTIMIZATION
-- =====================================================

-- Rollback RLS policy optimizations
-- Note: Most policies are already optimized, but if any were changed:

-- Example rollback pattern (adjust based on actual changes made):
/*
DROP POLICY IF EXISTS "Users can only access their own businesses" ON businesses;
CREATE POLICY "Users can only access their own businesses"
ON businesses FOR ALL
TO authenticated
USING ( auth.uid() = user_id ); -- Original unoptimized version
*/

-- Rollback performance indexes (if they cause issues)
-- Note: These are generally safe to keep, but can be dropped if needed
DROP INDEX CONCURRENTLY IF EXISTS idx_activities_business_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_business_settings_business_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_businesses_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_business_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_weekly_digests_business_id;

-- =====================================================
-- ROLLBACK COMMANDS FOR PHASE 3: FUNCTION SECURITY HARDENING
-- =====================================================

-- Rollback function search_path changes
-- Remove search_path security setting from functions

ALTER FUNCTION public.manual_review_sync_test() RESET search_path;
ALTER FUNCTION public.trigger_daily_review_sync() RESET search_path;
ALTER FUNCTION public.create_default_basic_subscription() RESET search_path;
ALTER FUNCTION public.get_auto_sync_businesses() RESET search_path;
ALTER FUNCTION public.validate_platform_api_connections() RESET search_path;
ALTER FUNCTION public.get_platform_api_stats() RESET search_path;
ALTER FUNCTION public.update_updated_at_column() RESET search_path;
ALTER FUNCTION public.create_business_settings() RESET search_path;

-- Note: Add other function names as identified during implementation

-- =====================================================
-- ROLLBACK COMMANDS FOR PHASE 4: AUTH CONFIGURATION
-- =====================================================

-- Rollback extension schema change
ALTER EXTENSION pg_net SET SCHEMA public;

-- Note: Auth settings (OTP expiry, leaked password protection) are managed 
-- via Supabase Dashboard and would need to be reverted there manually

-- =====================================================
-- EMERGENCY FULL ROLLBACK PROCEDURE
-- =====================================================

-- If you need to quickly revert everything to original state:

-- 1. Disable RLS on webhook_events_processed (if enabled during fix)
ALTER TABLE webhook_events_processed DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role webhook access" ON webhook_events_processed;

-- 2. Reset all function search_path settings
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT schemaname, routinename 
        FROM information_schema.routines 
        WHERE schemaname = 'public' AND routine_type = 'FUNCTION'
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.schemaname || '.' || func_record.routinename || '() RESET search_path';
    END LOOP;
END $$;

-- 3. Move pg_net back to public schema (if moved)
ALTER EXTENSION pg_net SET SCHEMA public;

-- 4. Restore original view definitions (requires manual work with backup data)
-- Use the backup queries from STEP 1 to recreate original views

-- =====================================================
-- VERIFICATION QUERIES AFTER ROLLBACK
-- =====================================================

-- Verify RLS status matches original state
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify policies are restored
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verify functions don't have search_path set
SELECT 
    routinename,
    routine_definition
FROM information_schema.routines 
WHERE schemaname = 'public' 
AND routine_type = 'FUNCTION'
AND routine_definition LIKE '%search_path%'
ORDER BY routinename;

-- Verify extension location
SELECT schemaname 
FROM pg_extension 
WHERE extname = 'pg_net';

-- =====================================================
-- MANUAL STEPS REQUIRED FOR COMPLETE ROLLBACK
-- =====================================================

/*
1. BEFORE IMPLEMENTING SECURITY FIXES:
   - Run the backup queries in STEP 1
   - Save the output to restore original state
   - Document current Supabase Dashboard auth settings

2. IF ROLLBACK IS NEEDED:
   - Execute relevant rollback commands above
   - Restore original view definitions using backup data
   - Revert auth settings in Supabase Dashboard:
     * Reset OTP expiry to original value
     * Disable leaked password protection if it was disabled originally
   - Test application functionality thoroughly

3. VERIFICATION AFTER ROLLBACK:
   - Run security advisor to confirm original warnings are back
   - Test all application functionality
   - Verify performance matches pre-change baseline
   - Confirm no new errors in application logs

4. COMMUNICATION:
   - Document rollback reason and timeline
   - Plan alternative security improvements if needed
   - Update team on system status
*/

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
SAFETY CONSIDERATIONS:
- Always backup production data before making schema changes
- Test rollback procedures in staging environment first
- Have monitoring in place to detect issues quickly
- Keep application logs monitoring active during changes

PERFORMANCE IMPACT:
- Dropping indexes may temporarily impact query performance
- Removing RLS optimizations will reduce query performance
- Monitor dashboard and API response times after rollback

DATA SECURITY:
- Disabling RLS on webhook_events_processed reduces security
- Reverting function security settings may increase vulnerability surface
- Consider implementing alternative security measures if rollback is permanent

RECOVERY TIME:
- Most rollback operations complete in seconds
- Index drops may take longer on large tables
- View recreation requires manual definition restoration
- Auth setting changes require dashboard access
*/