/**
 * Google Business Profile service for fetching reviews
 * Handles API calls to Google Business Profile with user credentials
 */

import { refreshAccessToken } from './googleOAuthService';
import { decryptFields, encryptFields } from './encryptionService';
import { supabaseAdmin } from '@/utils/supabase-admin';

export interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  comment?: string;
  starRating: number | string; // Can be number or string like "FIVE"
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  totalFetched: number;
  newReviews: number;
  updatedReviews: number;
  errors: string[];
  lastSyncTime: string;
}

/**
 * Fetch reviews from Google Business Profile API
 */
export async function fetchReviews(
  businessId: string,
  pageToken?: string,
  pageSize: number = 50
): Promise<GoogleReviewsResponse> {
  // Get business credentials
  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select('google_client_id, google_client_secret, google_access_token, google_refresh_token, google_account_id, google_location_id')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    throw new Error('Business not found or credentials missing');
  }

  if (!business.google_access_token || !business.google_account_id || !business.google_location_id) {
    throw new Error('Google Business Profile not connected. Please connect in Settings.');
  }

  // Try to decrypt credentials, fallback to plain text if not encrypted
  let decrypted;
  try {
    decrypted = decryptFields(business, [
      'google_client_id',
      'google_client_secret', 
      'google_access_token',
      'google_refresh_token',
      'google_account_id',
      'google_location_id'
    ]);
  } catch (decryptError) {
    // If decryption fails, assume they're stored as plain text (backward compatibility)
    console.log('Using plain text credentials for review fetch (not encrypted)');
    decrypted = {
      google_client_id: business.google_client_id,
      google_client_secret: business.google_client_secret,
      google_access_token: business.google_access_token,
      google_refresh_token: business.google_refresh_token,
      google_account_id: business.google_account_id,
      google_location_id: business.google_location_id,
    };
  }

  const reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${decrypted.google_account_id}/locations/${decrypted.google_location_id}/reviews`;
  
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    orderBy: 'updateTime desc', // Get newest reviews first
    ...(pageToken && { pageToken }),
  });

  try {
    const response = await fetch(`${reviewsUrl}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${decrypted.google_access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      if (decrypted.google_refresh_token) {
        try {
          const newTokens = await refreshAccessToken(
            decrypted.google_refresh_token,
            {
              clientId: decrypted.google_client_id,
              clientSecret: decrypted.google_client_secret,
            }
          );

          // Store new token
          const tokenData = { google_access_token: newTokens.access_token };
          const encryptedTokens = encryptFields(tokenData, ['google_access_token']);
          
          await supabaseAdmin
            .from('businesses')
            .update(encryptedTokens)
            .eq('id', businessId);

          // Retry request with new token
          const retryResponse = await fetch(`${reviewsUrl}?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${newTokens.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!retryResponse.ok) {
            throw new Error(`API request failed after token refresh: ${retryResponse.status} ${retryResponse.statusText}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          throw new Error(`Token refresh failed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error('Access token expired and no refresh token available. Please re-authenticate.');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch reviews: ${String(error)}`);
  }
}

/**
 * Sync reviews from Google Business Profile to our database
 */
export async function syncReviews(businessId: string, userId: string): Promise<SyncResult> {
  const startTime = new Date().toISOString();
  const result: SyncResult = {
    success: false,
    message: '',
    totalFetched: 0,
    newReviews: 0,
    updatedReviews: 0,
    errors: [],
    lastSyncTime: startTime,
  };

  try {
    // Verify business ownership
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id, last_review_sync')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found or access denied');
    }

    let totalFetched = 0;

    // Fetch only the latest 10 reviews (ordered by updateTime desc)
    try {
      const reviewsResponse = await fetchReviews(businessId, undefined, 10);
      
      if (reviewsResponse.reviews && reviewsResponse.reviews.length > 0) {
        console.log(`Processing ${reviewsResponse.reviews.length} latest reviews`);

        // Process batch of reviews
        for (const googleReview of reviewsResponse.reviews) {
          try {
            const reviewData = mapGoogleReviewToSchema(googleReview, businessId);
            console.log(`Processing review ${googleReview.reviewId} by ${reviewData.customer_name}`);
            
            // Upsert review (insert or update if exists)
            const { data: upsertedData, error: upsertError } = await supabaseAdmin
              .from('reviews')
              .upsert(reviewData, {
                onConflict: 'google_review_id',
                ignoreDuplicates: false,
              })
              .select('id, google_review_id');

            if (upsertError) {
              console.error(`Failed to save review ${googleReview.reviewId}:`, upsertError);
              result.errors.push(`Failed to save review ${googleReview.reviewId}: ${upsertError.message}`);
            } else {
              console.log(`Successfully saved review ${googleReview.reviewId}`);
              // For upsert, we can't easily distinguish new vs updated, so just count as processed
              result.newReviews++;
            }
          } catch (reviewError) {
            console.error(`Error processing review ${googleReview.reviewId}:`, reviewError);
            result.errors.push(`Error processing review ${googleReview.reviewId}: ${reviewError instanceof Error ? reviewError.message : 'Unknown error'}`);
          }
        }

        totalFetched = reviewsResponse.reviews.length;
      } else {
        console.log('No reviews found');
      }

    } catch (fetchError) {
      console.error('Error fetching reviews:', fetchError);
      result.errors.push(`Error fetching reviews: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    // Update last sync time
    await supabaseAdmin
      .from('businesses')
      .update({
        last_review_sync: startTime,
        updated_at: startTime,
      })
      .eq('id', businessId);

    // Create activity log
    await supabaseAdmin
      .from('activities')
      .insert({
        business_id: businessId,
        type: 'review_received',
        description: `Synced ${totalFetched} reviews from Google Business Profile`,
        metadata: {
          totalFetched,
          newReviews: result.newReviews,
          updatedReviews: result.updatedReviews,
          errors: result.errors.length,
        },
      });

    result.totalFetched = totalFetched;
    result.success = result.errors.length < totalFetched / 2; // Success if less than 50% errors
    result.message = result.success 
      ? `Successfully synced ${totalFetched} reviews (${result.newReviews} new, ${result.updatedReviews} updated)`
      : `Sync completed with errors. ${totalFetched} reviews processed, ${result.errors.length} errors.`;

    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    result.message = `Sync failed: ${result.errors[0]}`;
    return result;
  }
}

/**
 * Convert Google's star rating format to integer
 */
function convertStarRating(starRating: number | string): number {
  if (typeof starRating === 'number') {
    return starRating;
  }
  
  // Handle string format like "FIVE", "FOUR", etc.
  const ratingMap: { [key: string]: number } = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
  };
  
  const upperRating = starRating.toString().toUpperCase();
  return ratingMap[upperRating] || 5; // Default to 5 if unknown
}

/**
 * Map Google Business Profile review to our database schema
 */
function mapGoogleReviewToSchema(googleReview: GoogleReview, businessId: string): any {
  return {
    business_id: businessId,
    google_review_id: googleReview.reviewId,
    customer_name: googleReview.reviewer.displayName || 'Anonymous',
    customer_avatar_url: googleReview.reviewer.profilePhotoUrl || null,
    rating: convertStarRating(googleReview.starRating),
    review_text: googleReview.comment || 'No comment provided', // Handle empty reviews
    review_date: new Date(googleReview.createTime).toISOString(),
    status: 'pending',
    ai_reply: null, // Will be generated later by AI service
    final_reply: null,
    reply_tone: 'friendly',
    posted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Test Google Business Profile connection
 */
export async function testConnection(businessId: string): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Try to fetch just one review to test connection
    const reviewsResponse = await fetchReviews(businessId, undefined, 1);
    
    return {
      success: true,
      message: 'Successfully connected to Google Business Profile!',
      details: {
        hasReviews: reviewsResponse.reviews && reviewsResponse.reviews.length > 0,
        totalReviews: reviewsResponse.totalSize || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}