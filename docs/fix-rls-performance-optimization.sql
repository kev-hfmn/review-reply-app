-- RLS Performance Optimization Fix
-- Fixes auth_rls_initplan warnings by optimizing auth function calls in RLS policies
-- Issue: auth.uid() and auth.role() are re-evaluated for each row, causing performance issues
-- Solution: Wrap auth functions with (select auth.function()) to evaluate once per query

-- =====================================================
-- BACKUP: Current RLS Policies (for rollback if needed)
-- =====================================================

-- Save current policies for rollback
CREATE TABLE IF NOT EXISTS rls_policy_backup_temp AS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check,
    now() as backup_timestamp
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_preferences', 'subscriptions', 'businesses', 'reviews', 'business_settings', 'activities', 'weekly_digests', 'lemonsqueezy_webhook_events_processed');

-- =====================================================
-- OPTIMIZED RLS POLICIES
-- =====================================================

-- 1. USERS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create optimized policies
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING ((select auth.uid()) = id);

-- 2. USER_PREFERENCES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;

-- Create optimized policies
CREATE POLICY "Users can read their own preferences" ON public.user_preferences
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 3. SUBSCRIPTIONS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;

-- Create optimized policies
CREATE POLICY "Users can read their own subscriptions" ON public.subscriptions
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- 4. BUSINESSES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access their own businesses" ON public.businesses;

-- Create optimized policies
CREATE POLICY "Users can only access their own businesses" ON public.businesses
    FOR ALL USING ((select auth.uid()) = user_id);

-- 5. REVIEWS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access reviews for their businesses" ON public.reviews;

-- Create optimized policies
CREATE POLICY "Users can only access reviews for their businesses" ON public.reviews
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = (select auth.uid())
        )
    );

-- 6. BUSINESS_SETTINGS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access settings for their businesses" ON public.business_settings;

-- Create optimized policies
CREATE POLICY "Users can only access settings for their businesses" ON public.business_settings
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = (select auth.uid())
        )
    );

-- 7. ACTIVITIES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access activities for their businesses" ON public.activities;

-- Create optimized policies
CREATE POLICY "Users can only access activities for their businesses" ON public.activities
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = (select auth.uid())
        )
    );

-- 8. WEEKLY_DIGESTS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access digests for their businesses" ON public.weekly_digests;

-- Create optimized policies
CREATE POLICY "Users can only access digests for their businesses" ON public.weekly_digests
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = (select auth.uid())
        )
    );

-- 9. LEMONSQUEEZY_WEBHOOK_EVENTS_PROCESSED TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.lemonsqueezy_webhook_events_processed;

-- Create optimized policies
CREATE POLICY "Service role can manage webhook events" ON public.lemonsqueezy_webhook_events_processed
    FOR ALL USING ((select auth.role()) = 'service_role'::text);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all policies are updated
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_preferences', 'subscriptions', 'businesses', 'reviews', 'business_settings', 'activities', 'weekly_digests', 'lemonsqueezy_webhook_events_processed')
ORDER BY tablename, policyname;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================

/*
-- ROLLBACK: Restore original policies (run only if issues occur)

-- 1. USERS TABLE
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 2. USER_PREFERENCES TABLE
DROP POLICY IF EXISTS "Users can read their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;

CREATE POLICY "Users can read their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. SUBSCRIPTIONS TABLE
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can read their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. BUSINESSES TABLE
DROP POLICY IF EXISTS "Users can only access their own businesses" ON public.businesses;

CREATE POLICY "Users can only access their own businesses" ON public.businesses
    FOR ALL USING (auth.uid() = user_id);

-- 5. REVIEWS TABLE
DROP POLICY IF EXISTS "Users can only access reviews for their businesses" ON public.reviews;

CREATE POLICY "Users can only access reviews for their businesses" ON public.reviews
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = auth.uid()
        )
    );

-- 6. BUSINESS_SETTINGS TABLE
DROP POLICY IF EXISTS "Users can only access settings for their businesses" ON public.business_settings;

CREATE POLICY "Users can only access settings for their businesses" ON public.business_settings
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = auth.uid()
        )
    );

-- 7. ACTIVITIES TABLE
DROP POLICY IF EXISTS "Users can only access activities for their businesses" ON public.activities;

CREATE POLICY "Users can only access activities for their businesses" ON public.activities
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = auth.uid()
        )
    );

-- 8. WEEKLY_DIGESTS TABLE
DROP POLICY IF EXISTS "Users can only access digests for their businesses" ON public.weekly_digests;

CREATE POLICY "Users can only access digests for their businesses" ON public.weekly_digests
    FOR ALL USING (
        business_id IN (
            SELECT businesses.id
            FROM businesses
            WHERE businesses.user_id = auth.uid()
        )
    );

-- 9. LEMONSQUEEZY_WEBHOOK_EVENTS_PROCESSED TABLE
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.lemonsqueezy_webhook_events_processed;

CREATE POLICY "Service role can manage webhook events" ON public.lemonsqueezy_webhook_events_processed
    FOR ALL USING (auth.role() = 'service_role'::text);

-- Clean up backup table
DROP TABLE IF EXISTS rls_policy_backup_temp;
*/

-- =====================================================
-- CLEANUP
-- =====================================================

-- Clean up backup table after successful migration
-- DROP TABLE IF EXISTS rls_policy_backup_temp;

-- =====================================================
-- PERFORMANCE IMPACT
-- =====================================================

/*
PERFORMANCE IMPROVEMENTS EXPECTED:

1. Before: auth.uid() evaluated for EVERY row in result set
   After: (select auth.uid()) evaluated ONCE per query

2. For queries returning 1000+ rows, this reduces function calls from 1000+ to 1

3. Particularly beneficial for:
   - Dashboard queries (multiple tables with large datasets)
   - Review listings (potentially hundreds of reviews)
   - Business data aggregations
   - Digest generation queries

4. Should eliminate all "auth_rls_initplan" warnings in Supabase linter

5. No functional changes - security model remains identical
*/
