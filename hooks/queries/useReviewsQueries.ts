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
  // Create a stable query key by serializing filters properly
  const stableFilters = {
    search: filters.search,
    rating: filters.rating,
    status: filters.status,
    dateFrom: filters.dateRange.from?.toISOString() || null,
    dateTo: filters.dateRange.to?.toISOString() || null,
    businessId: filters.businessId
  }
  
  return useQuery({
    queryKey: ['reviews', businessId, stableFilters, page, pageSize],
    queryFn: async () => {
      if (!businessId) return { reviews: [], totalCount: 0 }
      
      // Copy exact logic from existing useReviewsData fetchReviews function
      let query = supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId)
        .order('review_date', { ascending: false })

      // Apply filters
      if (filters.rating !== null) {
        query = query.eq('rating', filters.rating)
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.dateRange.from) {
        query = query.gte('review_date', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange.to) {
        query = query.lte('review_date', filters.dateRange.to.toISOString())
      }

      // Apply pagination at database level for better performance
      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      // Apply text search (client-side for compatibility with existing logic)
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