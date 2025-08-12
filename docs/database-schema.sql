-- Flowrise Reviews Database Schema
-- Created for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'approved', 'posted', 'needs_edit', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('review_received', 'reply_posted', 'reply_approved', 'settings_updated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_mode AS ENUM ('manual', 'auto_4_plus', 'auto_except_low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. BUSINESSES TABLE
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

-- Enable RLS and create policies for businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own businesses" ON businesses;
CREATE POLICY "Users can only access their own businesses" ON businesses
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger for businesses
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

-- 2. REVIEWS TABLE
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

-- Enable RLS and create policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access reviews for their businesses" ON reviews;
CREATE POLICY "Users can only access reviews for their businesses" ON reviews
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Create updated_at trigger for reviews
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews(review_date);

-- 3. BUSINESS_SETTINGS TABLE
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

-- Enable RLS and create policies for business_settings
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access settings for their businesses" ON business_settings;
CREATE POLICY "Users can only access settings for their businesses" ON business_settings
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Create updated_at trigger for business_settings
DROP TRIGGER IF EXISTS update_business_settings_updated_at ON business_settings;
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for business_settings
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- 4. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    type activity_type NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access activities for their businesses" ON activities;
CREATE POLICY "Users can only access activities for their businesses" ON activities
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_business_id ON activities(business_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- 5. WEEKLY_DIGESTS TABLE
CREATE TABLE IF NOT EXISTS weekly_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_reviews INTEGER DEFAULT 0,
    rating_breakdown JSONB DEFAULT '{}', -- {1: 0, 2: 1, 3: 2, 4: 5, 5: 12}
    positive_themes TEXT[] DEFAULT '{}',
    improvement_themes TEXT[] DEFAULT '{}',
    highlights JSONB DEFAULT '[]', -- array of notable reviews
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, week_start)
);

-- Enable RLS and create policies for weekly_digests
ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access digests for their businesses" ON weekly_digests;
CREATE POLICY "Users can only access digests for their businesses" ON weekly_digests
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Create indexes for weekly_digests
CREATE INDEX IF NOT EXISTS idx_weekly_digests_business_id ON weekly_digests(business_id);
CREATE INDEX IF NOT EXISTS idx_weekly_digests_week_start ON weekly_digests(week_start);

-- Create a function to automatically create business settings when a business is created
CREATE OR REPLACE FUNCTION create_business_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO business_settings (business_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_business_settings_trigger ON businesses;
CREATE TRIGGER create_business_settings_trigger
    AFTER INSERT ON businesses
    FOR EACH ROW EXECUTE PROCEDURE create_business_settings();