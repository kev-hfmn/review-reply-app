export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  featured_image?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  category: string;
  read_time: number; // in minutes
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
}


export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
