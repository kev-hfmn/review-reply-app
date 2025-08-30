-- Supabase Blog Schema

-- 1. Create Posts Table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT, -- URL to the image
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT,
  tags TEXT[], -- Array of tags
  author_name TEXT,
  author_role TEXT,
  author_avatar TEXT, -- URL to the avatar
  read_time INT, -- in minutes
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  meta_title TEXT,
  meta_description TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Public Read Access
CREATE POLICY "Allow public read access to published posts" ON public.blog_posts FOR SELECT USING (published = true);

-- 4. Create a function to update the `updated_at` timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();
