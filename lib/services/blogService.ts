import { supabase } from '@/utils/supabase';
import { BlogPost, BlogPostsResponse, BlogFilters } from '@/types/blog';
import { getSupabaseImageUrl, transformImageUrlsInContent } from '@/lib/utils/imageUtils';

// Database type for Supabase responses
interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_role?: string;
  author_avatar?: string;
  featured_image?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  read_time: number;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  published: boolean;
  category: string;
  tags: string[];
}

/**
 * Transforms a BlogPostRow from database to BlogPost with proper image URLs
 */
function transformBlogPostData(postRow: BlogPostRow): BlogPost {
  return {
    id: postRow.id,
    title: postRow.title,
    slug: postRow.slug,
    excerpt: postRow.excerpt,
    content: transformImageUrlsInContent(postRow.content),
    author: {
      name: postRow.author_name,
      role: postRow.author_role,
      avatar: getSupabaseImageUrl(postRow.author_avatar) || undefined,
    },
    featured_image: getSupabaseImageUrl(postRow.featured_image) || undefined,
    published_at: postRow.published_at,
    created_at: postRow.created_at,
    updated_at: postRow.updated_at,
    tags: postRow.tags || [],
    category: postRow.category || '',
    read_time: postRow.read_time || 5,
    is_featured: postRow.is_featured || false,
    meta_title: postRow.meta_title,
    meta_description: postRow.meta_description,
  };
}

export class BlogService {
  /**
   * Fetch all blog posts with optional filtering and pagination
   */
  static async getPosts(filters: BlogFilters = {}): Promise<BlogPostsResponse> {
    try {
      const {
        category,
        tag,
        search,
        page = 1,
        per_page = 12
      } = filters;

      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .order('published_at', { ascending: false });

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
      }

      // Transform data to match BlogPost interface with proper image URLs
      const posts: BlogPost[] = (data || []).map((post: BlogPostRow) => transformBlogPostData(post));

      const total = count || 0;
      const total_pages = Math.ceil(total / per_page);

      return {
        posts,
        total,
        page,
        per_page,
        total_pages,
      };
    } catch (error) {
      console.error('BlogService.getPosts error:', error);
      throw error;
    }
  }

  /**
   * Fetch a single blog post by slug
   */
  static async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Post not found
        }
        console.error('Error fetching blog post:', error);
        throw error;
      }

      if (!data) return null;

      const postRow = data as BlogPostRow;
      return transformBlogPostData(postRow);
    } catch (error) {
      console.error('BlogService.getPostBySlug error:', error);
      throw error;
    }
  }

  /**
   * Fetch related posts based on tags and category
   */
  static async getRelatedPosts(currentPost: BlogPost, limit: number = 3): Promise<BlogPost[]> {
    try {
      // First, try to get posts from the same category
      let { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .neq('id', currentPost.id)
        .eq('published', true)
        .eq('category', currentPost.category)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching related posts by category:', error);
        // Fall back to just getting recent posts
        ({ data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .neq('id', currentPost.id)
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(limit));
        
        if (error) {
          console.error('Error fetching recent posts as fallback:', error);
          return [];
        }
      }

      return (data || []).map((post: BlogPostRow) => transformBlogPostData(post));
    } catch (error) {
      console.error('BlogService.getRelatedPosts error:', error);
      return [];
    }
  }

  /**
   * Get featured posts
   */
  static async getFeaturedPosts(limit: number = 3): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured posts:', error);
        throw error;
      }

      return (data || []).map((post: BlogPostRow) => transformBlogPostData(post));
    } catch (error) {
      console.error('BlogService.getFeaturedPosts error:', error);
      throw error;
    }
  }
}
