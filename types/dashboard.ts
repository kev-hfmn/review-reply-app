// Dashboard-specific type definitions for Flowrise Reviews
export interface Business {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  industry: string | null;
  google_business_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  google_review_id: string | null;
  customer_name: string;
  customer_avatar_url: string | null;
  rating: number;
  review_text: string;
  review_date: string;
  status: 'pending' | 'approved' | 'posted' | 'needs_edit' | 'skipped';
  ai_reply: string | null;
  final_reply: string | null;
  reply_tone: string;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  business_id: string;
  type: 'review_received' | 'reply_posted' | 'reply_approved' | 'settings_updated';
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  brand_voice_preset: string;
  formality_level: number;
  warmth_level: number;
  brevity_level: number;
  approval_mode: 'manual' | 'auto_4_plus' | 'auto_except_low';
  make_webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyDigest {
  id: string;
  business_id: string;
  week_start: string;
  week_end: string;
  total_reviews: number;
  rating_breakdown: Record<string, number>;
  positive_themes: string[];
  improvement_themes: string[];
  highlights: Array<{
    type: string;
    customer: string;
    rating: number;
    snippet: string;
  }>;
  generated_at: string;
  created_at: string;
}

// Dashboard-specific computed interfaces
export interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export interface DashboardActivity {
  id: string;
  action: string;
  timestamp: string;
  icon: React.ReactNode;
  type: Activity['type'];
}

export interface DashboardStats {
  reviewsThisWeek: number;
  reviewsThisWeekChange: number;
  repliesPosted: number;
  repliesPostedChange: number;
  avgRating: number;
  avgRatingChange: number;
  pendingApprovals: number;
  pendingApprovalsChange: number;
  totalReviews: number;
  recentActivities: Activity[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionText?: string;
}

// Chart data interface
export interface ChartDataPoint {
  date: string;
  reviews: number;
  avgRating?: number;
}

// API response interfaces
export interface DashboardData {
  businesses: Business[];
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  onboardingSteps: OnboardingStep[];
}