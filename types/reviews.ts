// Reviews page specific types for Flowrise Reviews
import type { Review, Business } from './dashboard';

export interface ReviewFilters {
  search: string;
  rating: number | null; // null = all ratings, 1-5 for specific
  status: Review['status'] | 'all';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  businessId: string | 'all';
}

export interface ReviewTableItem extends Review {
  // Add computed properties for table display
  customerDisplayName: string;
  truncatedReviewText: string;
  formattedReviewDate: string;
  statusColor: string;
  statusLabel: string;
}

export interface ReviewsPageData {
  reviews: ReviewTableItem[];
  businesses: Business[];
  totalCount: number;
  filteredCount: number;
}

export interface BulkActions {
  approve: (reviewIds: string[]) => Promise<void>;
  post: (reviewIds: string[]) => Promise<void>;
  skip: (reviewIds: string[]) => Promise<void>;
}

export interface ReviewActions {
  approve: (reviewId: string) => Promise<void>;
  post: (reviewId: string) => Promise<void>;
  skip: (reviewId: string) => Promise<void>;
  updateReply: (reviewId: string, reply: string) => Promise<void>;
  regenerateReply: (reviewId: string, tone?: string) => Promise<void>;
  updateStatus: (reviewId: string, status: Review['status']) => Promise<void>;
}

export interface ReviewDrawerData {
  review: Review | null;
  isOpen: boolean;
  isLoading: boolean;
  availableTones: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

// Form interfaces
export interface ReplyEditForm {
  reply: string;
  tone: string;
  isDirty: boolean;
  isValid: boolean;
}

export interface FilterFormData {
  search: string;
  rating: string; // string for form handling
  status: string;
  dateFrom: string;
  dateTo: string;
  businessId: string;
}

// Pagination
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Table selection
export interface SelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

// API response types
export interface ReviewsResponse {
  reviews: Review[];
  totalCount: number;
  hasMore: boolean;
}

export interface UpdateReviewRequest {
  id: string;
  status?: Review['status'];
  final_reply?: string;
  reply_tone?: string;
  ai_reply?: string;
}

export interface BulkUpdateRequest {
  reviewIds: string[];
  updates: Partial<Pick<Review, 'status' | 'final_reply' | 'posted_at'>>;
}

// Component props interfaces
export interface ReviewTableProps {
  reviews: ReviewTableItem[];
  isLoading: boolean;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
  onReviewClick: (review: Review) => void;
  onInlineEdit: (reviewId: string, reply: string) => void;
  onQuickAction: (reviewId: string, action: 'approve' | 'post' | 'skip') => void;
}

export interface ReviewFiltersProps {
  filters: ReviewFilters;
  businesses: Business[];
  onFiltersChange: (filters: ReviewFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
  resultCount: number;
}

export interface ReviewDrawerProps {
  data: ReviewDrawerData;
  onClose: () => void;
  onSave: (reviewId: string, reply: string, tone: string) => Promise<void>;
  onApprove: (reviewId: string) => Promise<void>;
  onPost: (reviewId: string) => Promise<void>;
  onRegenerate: (reviewId: string, tone: string) => Promise<void>;
}

export interface BulkActionsBarProps {
  selection: SelectionState;
  onApprove: () => void;
  onPost: () => void;
  onSkip: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

// Constants
export const REVIEW_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted', label: 'Posted' },
  { value: 'needs_edit', label: 'Needs Edit' },
  { value: 'skipped', label: 'Skipped' }
] as const;

export const RATING_FILTERS = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' }
] as const;

export const REPLY_TONES = [
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable tone'
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Formal and business-like tone'
  },
  {
    id: 'playful',
    label: 'Playful',
    description: 'Light-hearted and fun tone'
  },
  {
    id: 'empathetic',
    label: 'Empathetic',
    description: 'Understanding and compassionate tone'
  }
] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;