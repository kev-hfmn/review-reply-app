
# Reviews Data Caching Implementation Plan - TanStack Query

## Current Problem Analysis

### **Inefficient Data Fetching Behavior**
The current `useReviewsData` hook refetches reviews data on every component mount, causing:

1. **Excessive API Calls**: Navigate Reviews → Settings → Reviews = 2x API calls
2. **Poor User Experience**: Loading screens on every navigation
3. **Bandwidth Waste**: Re-downloading 2000+ reviews repeatedly
4. **Performance Impact**: Unnecessary database queries and network overhead

### **Current Architecture Issues**
```typescript
// Current problematic pattern in useReviewsData.ts (1000+ lines)
useEffect(() => {
  fetchReviews(); // Called on every mount
}, [fetchReviews, authLoading]);
```

**Problems:**
- No persistence across component unmounts
- No cache invalidation strategy
- No background revalidation
- Manual loading state management (200+ lines)
- Manual optimistic updates (300+ lines)
- Duplicate requests for same data

## Solution: TanStack Query Implementation ✅ CHOSEN

### **Why TanStack Query?**
Based on current codebase analysis and latest documentation, TanStack Query provides:

1. **Automatic Caching**: Data persists across component unmounts
2. **Background Refetching**: Show cached data instantly, update in background
3. **Request Deduplication**: Multiple components requesting same data = 1 API call
4. **Built-in Optimistic Updates**: Replace 300+ lines of manual optimistic update code
5. **Error Handling & Retry**: Built-in retry logic with exponential backoff
6. **Loading States**: Automatic isLoading, isError, isFetching states
7. **DevTools**: Built-in development tools for debugging
8. **Mutations**: Built-in mutation handling with onMutate, onError, onSuccess

### **Performance Benefits**
- **First Visit**: Normal fetch time
- **Subsequent Visits**: Instant display from cache
- **Background Updates**: Fresh data without loading screens
- **Code Reduction**: 70% less code (1000+ lines → ~300 lines)
- **Bandwidth Savings**: 60-80% reduction in API calls

## Exact Implementation Plan

### **Step 1: Setup QueryClient Provider** ⏱️ 15 minutes

#### **1.1 Dependencies** ✅ COMPLETED
```bash
npm install @tanstack/react-query
```

#### **1.2 Update Root Layout**
**File**: `app/layout.tsx`
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (error?.status >= 400 && error?.status < 500) return false
          return failureCount < 3
        },
      },
      mutations: { retry: 1 },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {/* Existing providers and children */}
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
```

### **Step 2: Create Fetcher Functions** ⏱️ 30 minutes

#### **2.1 Create Fetcher Utilities**
**File**: `lib/fetchers/reviews-fetcher.ts` (NEW)
```typescript
import { supabase } from '@/utils/supabase'
import type { ReviewFilters } from '@/types/reviews'
import type { Review, Business } from '@/types/dashboard'

// Businesses fetcher
export const fetchBusinesses = async (userId: string): Promise<Business[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Reviews fetcher with filters
export const fetchReviews = async (
  businessId: string,
  filters: ReviewFilters,
  page: number = 1,
  pageSize: number = 25
): Promise<{ reviews: Review[], totalCount: number }> => {
  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .order('review_date', { ascending: false })

  // Apply filters (copy from existing useReviewsData)
  if (filters.rating !== null) query = query.eq('rating', filters.rating)
  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.dateRange.from) query = query.gte('review_date', filters.dateRange.from.toISOString())
  if (filters.dateRange.to) query = query.lte('review_date', filters.dateRange.to.toISOString())

  // Apply pagination
  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  // Apply text search (client-side)
  let processedReviews = data || []
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    processedReviews = processedReviews.filter(review =>
      review.customer_name.toLowerCase().includes(searchTerm) ||
      review.review_text.toLowerCase().includes(searchTerm)
    )
  }

  return { reviews: processedReviews, totalCount: count || 0 }
}

// Mutation functions
export const updateReviewReply = async (reviewId: string, reply: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ ai_reply: reply, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const approveReview = async (reviewId: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const postReviewReply = async (reviewId: string, userId: string, replyText: string) => {
  const response = await fetch('/api/reviews/post-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewId, userId, replyText }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to post reply')
  }
  return response.json()
}
```

### **Step 3: Create Query & Mutation Hooks** ⏱️ 45 minutes

#### **3.1 Create TanStack Query Hooks**
**File**: `hooks/useReviewsDataTQ.ts` (NEW)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchBusinesses, fetchReviews, updateReviewReply, approveReview, postReviewReply } from '@/lib/fetchers/reviews-fetcher'
import type { ReviewFilters } from '@/types/reviews'
import type { Review, Business } from '@/types/dashboard'

// Business query hook
export const useBusinesses = (userId: string | null) => {
  return useQuery({
    queryKey: ['businesses', userId],
    queryFn: () => fetchBusinesses(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (businesses rarely change)
  })
}

// Reviews query hook with filters
export const useReviews = (
  businessId: string | null,
  filters: ReviewFilters,
  page: number,
  pageSize: number = 25
) => {
  return useQuery({
    queryKey: ['reviews', businessId, filters, page, pageSize],
    queryFn: () => fetchReviews(businessId!, filters, page, pageSize),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes (reviews change more frequently)
  })
}

// Mutation hooks with optimistic updates
export const useUpdateReviewReply = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) => 
      updateReviewReply(reviewId, reply),
    onMutate: async ({ reviewId, reply }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reviews'] })
      
      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['reviews'] })
      
      // Optimistically update all review queries
      queryClient.setQueriesData({ queryKey: ['reviews'] }, (old: any) => {
        if (!old?.reviews) return old
        return {
          ...old,
          reviews: old.reviews.map((review: Review) =>
            review.id === reviewId ? { ...review, ai_reply: reply } : review
          ),
        }
      })
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to update reply')
    },
    onSuccess: () => {
      toast.success('Reply updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const useApproveReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId: string) => approveReview(reviewId),
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey: ['reviews'] })
      const previousData = queryClient.getQueriesData({ queryKey: ['reviews'] })
      
      queryClient.setQueriesData({ queryKey: ['reviews'] }, (old: any) => {
        if (!old?.reviews) return old
        return {
          ...old,
          reviews: old.reviews.map((review: Review) =>
            review.id === reviewId ? { ...review, status: 'approved' } : review
          ),
        }
      })
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error('Failed to approve review')
    },
    onSuccess: () => {
      toast.success('Review approved successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export const usePostReply = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, userId, replyText }: { reviewId: string; userId: string; replyText: string }) => 
      postReviewReply(reviewId, userId, replyText),
    onMutate: async ({ reviewId, replyText }) => {
      await queryClient.cancelQueries({ queryKey: ['reviews'] })
      const previousData = queryClient.getQueriesData({ queryKey: ['reviews'] })
      
      queryClient.setQueriesData({ queryKey: ['reviews'] }, (old: any) => {
        if (!old?.reviews) return old
        return {
          ...old,
          reviews: old.reviews.map((review: Review) =>
            review.id === reviewId 
              ? { ...review, reply_text: replyText, status: 'replied', has_replied: true }
              : review
          ),
        }
      })
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(`Failed to post reply: ${err.message}`)
    },
    onSuccess: () => {
      toast.success('Reply posted successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}
```

### **Step 4: Implement New Hook Structure** ⏱️ 30 minutes

#### **4.1 Create Simplified Hook Interface**
**File**: `hooks/useReviewsData.ts` (REPLACE EXISTING)
```typescript
import { useState, useMemo } from 'react'
import { useBusinesses, useReviews, useUpdateReviewReply, useApproveReview, usePostReply } from './useReviewsDataTQ'
import { useAuth } from '@/contexts/AuthContext'
import type { ReviewFilters } from '@/types/reviews'
import type { Review, Business } from '@/types/dashboard'

// Default filters
const defaultFilters: ReviewFilters = {
  search: '',
  rating: null,
  status: 'all',
  dateRange: { from: null, to: null },
}

export const useReviewsData = () => {
  const { user } = useAuth()
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())
  const pageSize = 25

  // Queries
  const businessesQuery = useBusinesses(user?.id || null)
  const reviewsQuery = useReviews(selectedBusiness, filters, currentPage, pageSize)

  // Mutations
  const updateReplyMutation = useUpdateReviewReply()
  const approveReviewMutation = useApproveReview()
  const postReplyMutation = usePostReply()

  // Computed values
  const businesses = businessesQuery.data || []
  const reviews = reviewsQuery.data?.reviews || []
  const totalReviews = reviewsQuery.data?.totalCount || 0
  const totalPages = Math.ceil(totalReviews / pageSize)

  // Auto-select first business
  if (businesses.length > 0 && !selectedBusiness) {
    setSelectedBusiness(businesses[0].id)
  }

  // Handlers
  const handleUpdateReply = async (reviewId: string, reply: string) => {
    try {
      await updateReplyMutation.mutateAsync({ reviewId, reply })
    } catch (error) {
      console.error('Failed to update reply:', error)
    }
  }

  const handleApproveReview = async (reviewId: string) => {
    try {
      await approveReviewMutation.mutateAsync(reviewId)
    } catch (error) {
      console.error('Failed to approve review:', error)
    }
  }

  const handlePostReply = async (reviewId: string, replyText: string) => {
    if (!user?.id) throw new Error('User not authenticated')
    try {
      await postReplyMutation.mutateAsync({ reviewId, userId: user.id, replyText })
    } catch (error) {
      console.error('Failed to post reply:', error)
      throw error
    }
  }

  const handleBulkApprove = async () => {
    const promises = Array.from(selectedReviews).map(reviewId => 
      approveReviewMutation.mutateAsync(reviewId)
    )
    await Promise.all(promises)
    setSelectedReviews(new Set())
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  return {
    // Data
    businesses,
    reviews,
    selectedBusiness,
    filters,
    currentPage,
    totalPages,
    totalReviews,
    selectedReviews,
    
    // Loading states
    isLoadingBusinesses: businessesQuery.isLoading,
    isLoadingReviews: reviewsQuery.isLoading,
    isRefetching: reviewsQuery.isFetching && !reviewsQuery.isLoading,
    
    // Error states
    businessesError: businessesQuery.error,
    reviewsError: reviewsQuery.error,
    
    // Mutation states
    isUpdatingReply: updateReplyMutation.isPending,
    isApprovingReview: approveReviewMutation.isPending,
    isPostingReply: postReplyMutation.isPending,
    
    // Actions
    setSelectedBusiness,
    setFilters,
    setCurrentPage,
    setSelectedReviews,
    handleUpdateReply,
    handleApproveReview,
    handlePostReply,
    handleBulkApprove,
    resetFilters,
    
    // Refetch functions
    refetchBusinesses: businessesQuery.refetch,
    refetchReviews: reviewsQuery.refetch,
  }
}
```

### **Step 5: Update Component Integration** ⏱️ 20 minutes

#### **5.1 No Changes Needed!**
The beauty of this implementation is that the `useReviewsData` hook maintains the **exact same interface** as before. The reviews page component (`app/(app)/reviews/page.tsx`) will work without any changes!

#### **5.2 Performance Improvements**
- **Instant Navigation**: Reviews cached for 2 minutes, businesses for 10 minutes
- **Background Updates**: Data refreshes in background while showing cached version
- **Optimistic Updates**: UI updates immediately on user actions
- **Request Deduplication**: Multiple components using same data = 1 API call
- **Error Retry**: Automatic retry with exponential backoff
- **DevTools**: Built-in debugging in development

### **Step 6: Migration & Testing** ⏱️ 30 minutes

#### **6.1 Implementation Steps**
1. ✅ **Dependencies installed**: `@tanstack/react-query`
2. 🔄 **Setup QueryClient Provider** (Step 1.2)
3. 🔄 **Create fetcher functions** (Step 2.1)
4. 🔄 **Create TanStack Query hooks** (Step 3.1)
5. 🔄 **Replace useReviewsData hook** (Step 4.1)
6. 🔄 **Test functionality**
7. 🔄 **Monitor performance**

#### **6.2 Testing Checklist**
- [ ] Reviews load on first visit
- [ ] Navigation shows cached data instantly
- [ ] Background updates work
- [ ] Filters and pagination work
- [ ] Optimistic updates work (reply, approve)
- [ ] Error handling and retries work
- [ ] Bulk actions work
- [ ] DevTools show cache status

#### **6.3 Performance Monitoring**
- Use React DevTools Profiler to measure render performance
- Monitor Network tab for API call reduction
- Check TanStack Query DevTools for cache behavior
- Test on slow networks to verify background updates

## Expected Results

### **Code Reduction**
- **Before**: `useReviewsData.ts` = 932 lines
- **After**: Combined hooks = ~300 lines
- **Reduction**: ~70% less code

### **Performance Gains**
- **First Load**: Same speed
- **Navigation**: Instant (0ms) with cached data
- **API Calls**: 60-80% reduction
- **User Experience**: Smooth, no loading screens between pages
- **Bandwidth**: Significant savings
- **Memory**: Efficient garbage collection

### **Developer Experience**
- **Debugging**: Built-in DevTools
- **Error Handling**: Automatic retries and error boundaries
- **Testing**: Easier to test individual functions
- **Maintenance**: Cleaner, more focused code
- **Scalability**: Easy to add new queries/mutations

## Rollback Plan

If issues arise, the rollback is simple:
1. Rename `useReviewsData.ts` to `useReviewsDataTQ.ts`
2. Rename the backup original to `useReviewsData.ts`
3. Remove QueryClient provider from layout
4. Test that original functionality works

---

**Status**: Ready for implementation. All dependencies installed. Plan validated against current codebase structure.
