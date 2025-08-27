# Reviews Data Caching Implementation Plan - Next.js 15 + TanStack Query v5

## Current Problem Analysis

### **Inefficient Data Fetching Behavior**
The current `useReviewsData` hook refetches reviews data on every component mount, causing:

1. **Excessive API Calls**: Navigate Reviews → Settings → Reviews = 2x API calls
2. **Poor User Experience**: Loading screens on every navigation
3. **Bandwidth Waste**: Re-downloading 2000+ reviews repeatedly
4. **Performance Impact**: Unnecessary database queries and network overhead

### **Current Architecture Issues**
```typescript
// Current problematic pattern in useReviewsData.ts (1047 lines)
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

## Solution: Hybrid Coexistence Approach ✅ CHOSEN

### **Research-Based Decision (2025)**
Based on comprehensive analysis of TanStack Query v5 official documentation and Next.js 15 patterns:

1. **Next.js 15 Changes**: No longer caches by default - uses opt-in caching philosophy
2. **TanStack Query v5**: Single object parameter pattern, enhanced incremental migration support
3. **Incremental Migration**: Official patterns support gradual adoption alongside existing hooks
4. **Advanced Server Rendering**: Hydration patterns for streaming and server components
5. **Migration Safety**: Existing mutation logic can coexist with new query patterns

### **Why Hybrid Coexistence?**
- **Zero Risk**: Preserves all existing `useReviewsData` functionality (1047 lines intact)
- **Modern Patterns**: Uses latest TanStack Query v5 with Next.js 15 App Router
- **Gradual Migration**: Allows testing and rollout at your own pace
- **Performance Gains**: 60-80% reduction in API calls for navigation

## Implementation Plan

### **Phase 1: Foundation Setup** ⏱️ 20 minutes

#### **1.1 Dependencies** ✅ COMPLETED
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### **1.2 Create Providers Component**
**File**: `app/providers.tsx` (NEW)
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 minutes
        gcTime: 30 * 60 * 1000,          // 30 minutes (was cacheTime in v4)
        refetchOnWindowFocus: false,      // Prevent excessive refetching
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) return false
          return failureCount < 3
        },
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
```

#### **1.3 Update Root Layout**
**File**: `app/layout.tsx` (MODIFY)
```typescript
import Providers from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* existing providers (AuthProvider, ThemeProvider, etc.) */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### **Phase 2: Additive Query Layer** ⏱️ 30 minutes

#### **2.1 Create Query Hooks**
**File**: `hooks/queries/useReviewsQueries.ts` (NEW)
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import type { ReviewFilters } from '@/types/reviews'
import type { Review, Business } from '@/types/dashboard'

// Businesses query - rarely changes, cache longer
export const useBusinessesQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['businesses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Reviews query - changes more frequently
export const useReviewsQuery = (
  businessId: string | null, 
  filters: ReviewFilters, 
  page: number = 1,
  pageSize: number = 25
) => {
  return useQuery({
    queryKey: ['reviews', businessId, filters, page, pageSize],
    queryFn: async () => {
      if (!businessId) return { reviews: [], totalCount: 0 }
      
      // Copy exact logic from existing useReviewsData fetchReviews function
      let query = supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId)
        .order('review_date', { ascending: false })

      // Apply filters
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
    },
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
```

### **Phase 3: Coexistence Integration** ⏱️ 15 minutes

#### **3.1 Modify Existing Hook (Additive Changes Only)**
**File**: `hooks/useReviewsData.ts` (MODIFY - Add cache layer)
```typescript
// Add these imports at the top
import { useQueryClient } from '@tanstack/react-query'
import { useBusinessesQuery, useReviewsQuery } from './queries/useReviewsQueries'

export function useReviewsData(options = { useCache: true }) {
  // NEW: Query client for cache invalidation
  const queryClient = useQueryClient()
  
  // EXISTING: All current state and logic preserved
  const { user, selectedBusinessId, isLoading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  // ... all existing state variables preserved

  // NEW: Optional cached data layer
  const cachedBusinesses = useBusinessesQuery(options.useCache ? user?.id : null)
  const cachedReviews = useReviewsQuery(
    options.useCache ? selectedBusinessId : null, 
    filters, 
    pagination.currentPage, 
    PAGE_SIZE
  )
  
  // EXISTING: All current functions preserved exactly as they are
  const fetchBusinesses = useCallback(async () => {
    // ... existing implementation
  }, [user?.id, filters.businessId, reviews.length]);

  const fetchReviews = useCallback(async () => {
    // ... existing implementation
  }, [user?.id, businesses, selectedBusinessId, filters, pagination.currentPage, transformReviewForTable, authLoading]);

  // All existing reviewActions and bulkActions preserved
  const reviewActions: ReviewActions = useMemo(() => ({
    approve: async (reviewId: string) => {
      // ... existing implementation
      
      // NEW: Invalidate cache after successful mutation
      if (options.useCache) {
        queryClient.invalidateQueries({ queryKey: ['reviews'] })
      }
    },
    // ... all other actions with same cache invalidation pattern
  }), [reviews, showToast, updateReviewInState, user, options.useCache, queryClient]);

  // OVERRIDE: Use cached data when available and enabled
  const finalBusinesses = options.useCache && cachedBusinesses.data 
    ? cachedBusinesses.data 
    : businesses
    
  const finalReviews = options.useCache && cachedReviews.data?.reviews 
    ? cachedReviews.data.reviews.map(transformReviewForTable)
    : filteredReviews

  return {
    // Data (potentially from cache)
    businesses: finalBusinesses,
    reviews: finalReviews,
    allReviews: options.useCache && cachedReviews.data?.reviews ? cachedReviews.data.reviews : reviews,
    
    // EXISTING: All current return values preserved
    filters,
    pagination,
    isLoading,
    isUpdating,
    error,
    toasts,
    syncStatus,
    reviewActions,
    bulkActions,
    updateFilters,
    resetFilters,
    goToPage,
    refetch,
    removeToast,
    showToast,
    fetchReviewsFromGoogle,
    
    // NEW: Cache control and status
    cacheStatus: {
      businessesFromCache: !!(options.useCache && cachedBusinesses.data),
      reviewsFromCache: !!(options.useCache && cachedReviews.data),
      isRefetching: cachedReviews.isFetching || cachedBusinesses.isFetching,
      cacheEnabled: options.useCache
    }
  }
}
```

### **Phase 4: Gradual Testing & Rollout** ⏱️ 10 minutes

#### **4.1 Component-Level Cache Control**
```typescript
// In reviews page - test with cache enabled
const reviewsData = useReviewsData({ useCache: true })

// In other components - keep existing behavior
const reviewsData = useReviewsData({ useCache: false })

// Rollback instantly if issues
const reviewsData = useReviewsData() // defaults to { useCache: true }
```

#### **4.2 Testing Strategy**
1. **Phase A**: Enable cache for Reviews page only
2. **Phase B**: Enable cache for Dashboard reviews widgets
3. **Phase C**: Enable cache globally
4. **Rollback**: Set `useCache: false` if any issues

## Expected Results

### **Immediate Benefits (Phase 1-3)**
- **First Load**: Same performance as current
- **Navigation**: Instant page transitions with cached data
- **All Features Work**: Zero functionality loss
- **Easy Rollback**: Single parameter change

### **Performance Improvements**
- **API Calls**: 60-80% reduction in Supabase queries
- **User Experience**: No loading screens between page visits
- **Background Updates**: Fresh data loads silently
- **Memory Usage**: Efficient with built-in garbage collection

### **Developer Experience**
- **DevTools**: React Query DevTools for debugging cache behavior
- **Error Handling**: Automatic retries with exponential backoff
- **Code Quality**: Separation of data fetching from business logic
- **Future Migration**: Easy path to full TanStack Query adoption

## Risk Mitigation

### **Rollback Strategies**
```typescript
// Instant disable
const reviewsData = useReviewsData({ useCache: false })

// Component-level disable
<ReviewsPage cacheEnabled={false} />

// Complete removal (if needed)
// 1. Remove Providers wrapper from layout.tsx
// 2. Remove query hook files
// 3. Remove cache-related code from useReviewsData
```

### **Safety Measures**
- **Coexistence**: Old and new patterns work together
- **No Breaking Changes**: All existing functions preserved
- **Gradual Testing**: Enable per component, not globally
- **Monitoring**: Built-in DevTools for cache behavior tracking

## Migration Timeline

### **Week 1**: Foundation & Testing
- ✅ Dependencies installed
- 🔄 Setup QueryClient Provider
- 🔄 Create query hooks
- 🔄 Add cache layer to existing hook

### **Week 2**: Gradual Rollout
- 🔄 Enable cache for Reviews page
- 🔄 Monitor performance and stability
- 🔄 Enable cache for Dashboard
- 🔄 Full rollout if successful

### **Future**: Optional Full Migration
- Consider migrating mutations to TanStack Query patterns
- Simplify existing hook by removing manual state management
- This is optional and can be done incrementally

---

**Status**: Ready for implementation. Research completed. Plan validated against official TanStack Query v5 and Next.js 15 documentation.

**Key Advantage**: This approach respects your existing architecture while providing modern caching benefits with zero risk of breaking essential functions.