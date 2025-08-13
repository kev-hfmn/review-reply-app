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

export interface FetchOptions {
  timePeriod: 'all' | '7days' | '30days' | '3months' | '6months';
  reviewCount: 10 | 25 | 50 | 100 | 200;
}

export interface SyncResult {
  success: boolean;
  message: string;
  totalFetched: number;
  newReviews: number;
  updatedReviews: number;
  errors: string[];
  lastSyncTime: string;
  fetchOptions?: FetchOptions;
}

/**
 * Calculate time cutoff based on selected period
 */
function getTimeCutoff(timePeriod: FetchOptions['timePeriod']): Date | null {
  if (timePeriod === 'all') return null;

  const now = new Date();
  const cutoff = new Date(now);

  switch (timePeriod) {
    case '7days':
      cutoff.setDate(now.getDate() - 7);
      break;
    case '30days':
      cutoff.setDate(now.getDate() - 30);
      break;
    case '3months':
      cutoff.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      cutoff.setMonth(now.getMonth() - 6);
      break;
    default:
      return null;
  }

  return cutoff;
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
 * Uses smart pagination to avoid fetching duplicate reviews
 */
export async function syncReviews(
  businessId: string,
  userId: string,
  options: FetchOptions = { timePeriod: '30days', reviewCount: 50 }
): Promise<SyncResult> {
  const startTime = new Date().toISOString();
  const result: SyncResult = {
    success: false,
    message: '',
    totalFetched: 0,
    newReviews: 0,
    updatedReviews: 0,
    errors: [],
    lastSyncTime: startTime,
    fetchOptions: options,
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

    // Check what reviews we already have to avoid duplicates
    const { data: existingReviews, error: existingError } = await supabaseAdmin
      .from('reviews')
      .select('google_review_id, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) {
      console.error('Error checking existing reviews:', existingError);
      // Continue anyway, but log the error
      result.errors.push(`Warning: Could not check existing reviews: ${existingError.message}`);
    }

    const hasExistingReviews = existingReviews && existingReviews.length > 0;
    const newestExistingReview = hasExistingReviews ? existingReviews[0] : null;

    console.log(hasExistingReviews
      ? `Found existing reviews. Newest review created at: ${newestExistingReview?.created_at}`
      : 'No existing reviews found. Fetching latest reviews.');

    // Calculate time cutoff based on selected period
    const timeCutoff = getTimeCutoff(options.timePeriod);
    const maxReviewsToFetch = options.reviewCount;

    console.log(`Fetch parameters: ${options.timePeriod} (since ${timeCutoff?.toISOString()}), max ${maxReviewsToFetch} reviews`);

    let totalFetched = 0;
    let pageToken: string | undefined = undefined;
    let shouldContinue = true;
    let pagesProcessed = 0;
    const maxPages = Math.ceil(maxReviewsToFetch / 50); // Calculate pages needed

    // Fetch reviews with smart pagination
    while (shouldContinue && pagesProcessed < maxPages) {
      try {
        // Use optimal page size: min(50, remaining reviews needed)
        const remainingReviews = maxReviewsToFetch - result.newReviews;
        const pageSize = Math.min(50, Math.max(10, remainingReviews));

        console.log(`Fetching page ${pagesProcessed + 1} with pageSize=${pageSize}`);
        const reviewsResponse = await fetchReviews(businessId, pageToken, pageSize);

        if (reviewsResponse.reviews && reviewsResponse.reviews.length > 0) {
          console.log(`Processing page ${pagesProcessed + 1}: ${reviewsResponse.reviews.length} reviews`);

          let newReviewsInBatch = 0;
          let duplicatesFound = 0;
          let tooOldCount = 0;

          // Process batch of reviews
          for (const googleReview of reviewsResponse.reviews) {
            try {
              // Check if we've reached our review count limit
              if (result.newReviews >= maxReviewsToFetch) {
                console.log(`Reached review count limit (${maxReviewsToFetch}), stopping`);
                shouldContinue = false;
                break;
              }

              // Check if review is within time period
              if (timeCutoff) {
                const reviewDate = new Date(googleReview.createTime);
                if (reviewDate < timeCutoff) {
                  console.log(`Review ${googleReview.reviewId} is older than ${options.timePeriod} cutoff, skipping`);
                  tooOldCount++;
                  // If we find several old reviews in a row, stop pagination
                  if (tooOldCount >= 5) {
                    console.log('Found many reviews older than time period, stopping pagination');
                    shouldContinue = false;
                    break;
                  }
                  continue;
                }
              }

              // Check if this review already exists in our database
              const { data: existingReview, error: checkError } = await supabaseAdmin
                .from('reviews')
                .select('id, google_review_id, ai_reply, status')
                .eq('google_review_id', googleReview.reviewId)
                .single();

              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error(`Error checking for existing review ${googleReview.reviewId}:`, checkError);
                result.errors.push(`Error checking review ${googleReview.reviewId}: ${checkError.message}`);
                continue;
              }

              if (existingReview) {
                // Review already exists - skip it to preserve AI replies and status
                console.log(`Skipping existing review ${googleReview.reviewId} (preserving AI reply and status)`);
                duplicatesFound++;
                continue;
              }

              // This is a new review - insert it
              const reviewData = mapGoogleReviewToSchema(googleReview, businessId);
              console.log(`Inserting new review ${googleReview.reviewId} by ${reviewData.customer_name}`);

              const { error: insertError } = await supabaseAdmin
                .from('reviews')
                .insert(reviewData)
                .select('id, google_review_id');

              if (insertError) {
                console.error(`Failed to insert review ${googleReview.reviewId}:`, insertError);
                result.errors.push(`Failed to insert review ${googleReview.reviewId}: ${insertError.message}`);
              } else {
                console.log(`Successfully inserted new review ${googleReview.reviewId}`);
                newReviewsInBatch++;
                result.newReviews++;
              }
            } catch (reviewError) {
              console.error(`Error processing review ${googleReview.reviewId}:`, reviewError);
              result.errors.push(`Error processing review ${googleReview.reviewId}: ${reviewError instanceof Error ? reviewError.message : 'Unknown error'}`);
            }
          }

          totalFetched += reviewsResponse.reviews.length;
          pagesProcessed++;

          console.log(`Batch complete: ${newReviewsInBatch} new reviews, ${duplicatesFound} duplicates skipped, ${tooOldCount} too old`);

          // Stop conditions
          if (result.newReviews >= maxReviewsToFetch) {
            console.log(`Reached target review count (${maxReviewsToFetch})`);
            shouldContinue = false;
          }
          // If we found mostly duplicates, we've likely reached reviews we already have
          else if (duplicatesFound > newReviewsInBatch && duplicatesFound > 5) {
            console.log('Found many duplicates, stopping pagination to avoid unnecessary API calls');
            shouldContinue = false;
          }
          // If we found many old reviews, we've gone past our time period
          else if (tooOldCount >= 5) {
            console.log('Found many reviews outside time period, stopping pagination');
            shouldContinue = false;
          }
          // Continue to next page if available
          else if (reviewsResponse.nextPageToken) {
            pageToken = reviewsResponse.nextPageToken;
          } else {
            console.log('No more pages available');
            shouldContinue = false;
          }
        } else {
          console.log('No reviews found in this batch');
          shouldContinue = false;
        }

      } catch (fetchError) {
        console.error('Error fetching reviews:', fetchError);
        result.errors.push(`Error fetching reviews: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        shouldContinue = false;
      }
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
  // Extract existing reply from Google if it exists
  const existingReply = googleReview.reviewReply?.comment || null;
  const replyStatus = existingReply ? 'posted' : 'pending';

  return {
    business_id: businessId,
    google_review_id: googleReview.reviewId,
    customer_name: googleReview.reviewer.displayName || 'Anonymous',
    customer_avatar_url: googleReview.reviewer.profilePhotoUrl || null,
    rating: convertStarRating(googleReview.starRating),
    review_text: googleReview.comment || 'No comment provided', // Handle empty reviews
    review_date: new Date(googleReview.createTime).toISOString(),
    status: replyStatus, // 'posted' if reply exists, 'pending' if not
    ai_reply: existingReply, // Store existing Google reply here
    final_reply: existingReply, // Also store as final reply if it exists
    reply_tone: 'friendly',
    posted_at: googleReview.reviewReply?.updateTime ? new Date(googleReview.reviewReply.updateTime).toISOString() : null,
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
