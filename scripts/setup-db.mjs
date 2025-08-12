import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration
const supabaseUrl = 'https://tanxlkgdefjsdynwqend.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbnhsa2dkZWZqc2R5bndxZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5MTY4NCwiZXhwIjoyMDcwNTY3Njg0fQ.tpJEojkIUHSM6rRyB6SCnrzkhdLGx-jkXDL-BxF_0Fs'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  return { data, error }
}

async function setupDatabase() {
  console.log('🚀 Setting up Flowrise Reviews database schema...')

  // Create custom types first
  const createTypes = [
    "DO $$ BEGIN CREATE TYPE review_status AS ENUM ('pending', 'approved', 'posted', 'needs_edit', 'skipped'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
    "DO $$ BEGIN CREATE TYPE activity_type AS ENUM ('review_received', 'reply_posted', 'reply_approved', 'settings_updated'); EXCEPTION WHEN duplicate_object THEN null; END $$;",
    "DO $$ BEGIN CREATE TYPE approval_mode AS ENUM ('manual', 'auto_4_plus', 'auto_except_low'); EXCEPTION WHEN duplicate_object THEN null; END $$;"
  ]

  for (const sql of createTypes) {
    console.log('Creating custom types...')
    const { error } = await executeSQL(sql)
    if (error) console.error('Type creation error:', error.message)
  }

  // Create update trigger function
  const triggerFunction = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `

  console.log('Creating trigger function...')
  const { error: triggerError } = await executeSQL(triggerFunction)
  if (triggerError) console.error('Trigger function error:', triggerError.message)

  // Create businesses table
  const businessesTable = `
    CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        industry TEXT,
        google_business_id TEXT,
        google_access_token TEXT,
        google_refresh_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  console.log('Creating businesses table...')
  let { error } = await executeSQL(businessesTable)
  if (error) console.error('Businesses table error:', error.message)

  // Enable RLS for businesses
  const businessesRLS = `
    ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can only access their own businesses" ON businesses;
    CREATE POLICY "Users can only access their own businesses" ON businesses
        FOR ALL USING (auth.uid() = user_id);
  `

  console.log('Setting up businesses RLS...')
  ;({ error } = await executeSQL(businessesRLS))
  if (error) console.error('Businesses RLS error:', error.message)

  // Create reviews table
  const reviewsTable = `
    CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
        google_review_id TEXT UNIQUE,
        customer_name TEXT NOT NULL,
        customer_avatar_url TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        review_text TEXT NOT NULL,
        review_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status review_status DEFAULT 'pending' NOT NULL,
        ai_reply TEXT,
        final_reply TEXT,
        reply_tone TEXT DEFAULT 'friendly',
        posted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  console.log('Creating reviews table...')
  ;({ error } = await executeSQL(reviewsTable))
  if (error) console.error('Reviews table error:', error.message)

  // Enable RLS for reviews
  const reviewsRLS = `
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can only access reviews for their businesses" ON reviews;
    CREATE POLICY "Users can only access reviews for their businesses" ON reviews
        FOR ALL USING (
            business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        );
  `

  console.log('Setting up reviews RLS...')
  ;({ error } = await executeSQL(reviewsRLS))
  if (error) console.error('Reviews RLS error:', error.message)

  // Create business_settings table
  const businessSettingsTable = `
    CREATE TABLE IF NOT EXISTS business_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
        brand_voice_preset TEXT DEFAULT 'friendly',
        formality_level INTEGER CHECK (formality_level >= 1 AND formality_level <= 10) DEFAULT 5,
        warmth_level INTEGER CHECK (warmth_level >= 1 AND warmth_level <= 10) DEFAULT 7,
        brevity_level INTEGER CHECK (brevity_level >= 1 AND brevity_level <= 10) DEFAULT 5,
        approval_mode approval_mode DEFAULT 'manual',
        make_webhook_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  console.log('Creating business_settings table...')
  ;({ error } = await executeSQL(businessSettingsTable))
  if (error) console.error('Business settings table error:', error.message)

  // Create activities table
  const activitiesTable = `
    CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
        type activity_type NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  console.log('Creating activities table...')
  ;({ error } = await executeSQL(activitiesTable))
  if (error) console.error('Activities table error:', error.message)

  // Create weekly_digests table
  const digestsTable = `
    CREATE TABLE IF NOT EXISTS weekly_digests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        total_reviews INTEGER DEFAULT 0,
        rating_breakdown JSONB DEFAULT '{}',
        positive_themes TEXT[] DEFAULT '{}',
        improvement_themes TEXT[] DEFAULT '{}',
        highlights JSONB DEFAULT '[]',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(business_id, week_start)
    );
  `

  console.log('Creating weekly_digests table...')
  ;({ error } = await executeSQL(digestsTable))
  if (error) console.error('Weekly digests table error:', error.message)

  // Add RLS to remaining tables
  const remainingRLS = `
    ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can only access settings for their businesses" ON business_settings;
    CREATE POLICY "Users can only access settings for their businesses" ON business_settings
        FOR ALL USING (
            business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can only access activities for their businesses" ON activities;
    CREATE POLICY "Users can only access activities for their businesses" ON activities
        FOR ALL USING (
            business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Users can only access digests for their businesses" ON weekly_digests;
    CREATE POLICY "Users can only access digests for their businesses" ON weekly_digests
        FOR ALL USING (
            business_id IN (
                SELECT id FROM businesses WHERE user_id = auth.uid()
            )
        );
  `

  console.log('Setting up RLS for remaining tables...')
  ;({ error } = await executeSQL(remainingRLS))
  if (error) console.error('Remaining RLS error:', error.message)

  // Create indexes
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);",
    "CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);",
    "CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);",
    "CREATE INDEX IF NOT EXISTS idx_activities_business_id ON activities(business_id);",
    "CREATE INDEX IF NOT EXISTS idx_weekly_digests_business_id ON weekly_digests(business_id);"
  ]

  console.log('Creating indexes...')
  for (const indexSQL of indexes) {
    const { error } = await executeSQL(indexSQL)
    if (error) console.error('Index error:', error.message)
  }

  console.log('✅ Database setup completed!')

  // Test by checking if tables exist
  console.log('\n🔍 Verifying table creation...')
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['businesses', 'reviews', 'business_settings', 'activities', 'weekly_digests'])

  if (tables) {
    console.log('✅ Created tables:', tables.map(t => t.table_name).join(', '))
  }
}

setupDatabase().catch(console.error)