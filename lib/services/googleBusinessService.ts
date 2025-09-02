/**
 * Google Business Profile service for fetching reviews
 * Handles API calls to Google Business Profile with platform credentials
 */

import { refreshAccessToken, discoverBusinessLocations, getBusinessInfo, validateBusinessAccess, type BusinessLocation } from './googleOAuthService';
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
  syncType?: 'initial_backfill' | 'incremental';
  backfillComplete?: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'needs_reconnection' | 'error';
  message: string;
  businessInfo?: BusinessLocation;
  lastConnectionAttempt?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  message: string;
  newAccessToken?: string;
}

/**
 * Fetch reviews from Google Business Profile API
 */
export async function fetchReviews(
  businessId: string,
  pageToken?: string,
  pageSize: number = 50
): Promise<GoogleReviewsResponse> {
  // Get business credentials (platform OAuth - no user credentials needed)
  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select('google_access_token, google_refresh_token, google_account_id, google_location_id, connection_status')
    .eq('id', businessId)
    .single();

  if (error || !business) {
    throw new Error('Business not found or credentials missing');
  }

  if (!business.google_access_token || !business.google_account_id || !business.google_location_id) {
    throw new Error('Google Business Profile not connected. Please connect in Settings.');
  }

  if (business.connection_status === 'needs_reconnection') {
    throw new Error('Google Business Profile needs reconnection. Please reconnect in Settings.');
  }

  // Try to decrypt credentials, fallback to plain text if not encrypted
  let decrypted;
  try {
    decrypted = decryptFields(business, [
      'google_access_token',
      'google_refresh_token',
      'google_account_id'
      // google_location_id is now stored as plain text
    ]);
    // Add plain text location ID
    decrypted.google_location_id = business.google_location_id;
  } catch {
    // If decryption fails, assume they're stored as plain text (backward compatibility)
    console.log('Using plain text credentials for review fetch (not encrypted)');
    decrypted = {
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
      // Token expired, try to refresh using platform credentials
      if (decrypted.google_refresh_token) {
        try {
          const newTokens = await refreshAccessToken(decrypted.google_refresh_token);

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
 * Uses two-phase approach: initial backfill + incremental updates
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

    // Determine sync type: initial backfill or incremental
    const needsBackfill = !business.last_review_sync ||
      (new Date().getTime() - new Date(business.last_review_sync).getTime()) > 30 * 24 * 60 * 60 * 1000; // 30+ days ago

    if (needsBackfill) {
      console.log('🔄 Starting INITIAL BACKFILL - fetching reviews from last 2 years');
      result.syncType = 'initial_backfill';
      await performInitialBackfill(businessId, result);
    } else {
      console.log('⚡ Starting INCREMENTAL SYNC - fetching only new reviews');
      result.syncType = 'incremental';
      await performIncrementalSync(businessId, result);
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
        description: result.syncType === 'initial_backfill'
          ? `Initial backfill completed: ${result.newReviews} new reviews found (${result.totalFetched} total processed)`
          : result.newReviews > 0
            ? `Incremental sync: ${result.newReviews} new reviews found`
            : `Incremental sync: No new reviews found`,
        metadata: {
          syncType: result.syncType,
          totalFetched: result.totalFetched,
          newReviews: result.newReviews,
          updatedReviews: result.updatedReviews,
          errors: result.errors.length,
        },
      });

    result.success = result.errors.length < result.totalFetched / 2; // Success if less than 50% errors
    result.message = result.success
      ? result.syncType === 'initial_backfill'
        ? `Initial backfill completed: ${result.newReviews} new reviews found (${result.totalFetched} total processed)`
        : result.newReviews > 0
          ? `Incremental sync completed: ${result.newReviews} new reviews found`
          : `Incremental sync completed: No new reviews found`
      : `Sync completed with errors. ${result.totalFetched} reviews processed, ${result.errors.length} errors.`;

    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    result.message = `Sync failed: ${result.errors[0]}`;
    return result;
  }
}

/**
 * Initial backfill: Fetch all reviews from last 2 years
 */
async function performInitialBackfill(businessId: string, result: SyncResult): Promise<void> {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  console.log(`📅 Backfill cutoff date: ${twoYearsAgo.toISOString()}`);

  let pageToken: string | undefined = undefined;
  let shouldContinue = true;
  let pagesProcessed = 0;
  let consecutiveOldReviews = 0;
  const maxPages = 100; // Safety limit

  while (shouldContinue && pagesProcessed < maxPages) {
    try {
      console.log(`📄 Fetching backfill page ${pagesProcessed + 1}`);
      const reviewsResponse = await fetchReviews(businessId, pageToken, 50);

      if (reviewsResponse.reviews && reviewsResponse.reviews.length > 0) {
        let newReviewsInBatch = 0;
        let oldReviewsInBatch = 0;

        for (const googleReview of reviewsResponse.reviews) {
          try {
            const reviewDate = new Date(googleReview.createTime);

            // Check if review is too old (beyond 2-year cutoff)
            if (reviewDate < twoYearsAgo) {
              oldReviewsInBatch++;
              consecutiveOldReviews++;

              console.log(`📅 Old review found: ${reviewDate.toLocaleDateString()} vs cutoff ${twoYearsAgo.toLocaleDateString()} (${consecutiveOldReviews} consecutive old)`);

              // If we find 5 consecutive old reviews, stop backfill (much more aggressive)
              if (consecutiveOldReviews >= 5) {
                console.log(`⏹️ Found ${consecutiveOldReviews} consecutive old reviews beyond 2-year cutoff, stopping backfill`);
                shouldContinue = false;
                break;
              }
              continue;
            } else {
              consecutiveOldReviews = 0; // Reset counter for any review within 2-year window
            }

            // Check for duplicates
            const { data: existingReview, error: checkError } = await supabaseAdmin
              .from('reviews')
              .select('id')
              .eq('google_review_id', googleReview.reviewId)
              .single();

            if (checkError && checkError.code !== 'PGRST116') {
              console.error(`❌ Error checking review ${googleReview.reviewId}:`, checkError);
              result.errors.push(`Error checking review: ${checkError.message}`);
              continue;
            }

            if (existingReview) {
              // Skip existing review
              continue;
            }

            // Insert new review
            const reviewData = mapGoogleReviewToSchema(googleReview, businessId);
            const { error: insertError } = await supabaseAdmin
              .from('reviews')
              .insert(reviewData);

            if (insertError) {
              console.error(`❌ Failed to insert review ${googleReview.reviewId}:`, insertError);
              result.errors.push(`Failed to insert review: ${insertError.message}`);
            } else {
              console.log(`✅ Inserted review ${googleReview.reviewId} (${reviewDate.toLocaleDateString()})`);
              newReviewsInBatch++;
              result.newReviews++;
            }
          } catch (reviewError) {
            console.error(`❌ Error processing review:`, reviewError);
            result.errors.push(`Error processing review: ${reviewError instanceof Error ? reviewError.message : 'Unknown error'}`);
          }
        }

        result.totalFetched += reviewsResponse.reviews.length;
        pagesProcessed++;

        console.log(`📊 Backfill batch complete: ${newReviewsInBatch} new, ${oldReviewsInBatch} too old`);

        // Continue pagination
        if (reviewsResponse.nextPageToken && shouldContinue) {
          pageToken = reviewsResponse.nextPageToken;
        } else {
          console.log('📄 No more pages available');
          shouldContinue = false;
        }
      } else {
        console.log('📄 No reviews in this batch');
        shouldContinue = false;
      }
    } catch (fetchError) {
      console.error('❌ Error fetching backfill page:', fetchError);
      result.errors.push(`Error fetching reviews: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      shouldContinue = false;
    }
  }

  result.backfillComplete = true;
  console.log(`🎉 Initial backfill complete: ${result.newReviews} new reviews from last 2 years`);

  // Update backfill completion status
  await supabaseAdmin
    .from('businesses')
    .update({ initial_backfill_complete: true })
    .eq('id', businessId);
}

/**
 * Incremental sync: Fetch only reviews newer than our newest review
 */
async function performIncrementalSync(businessId: string, result: SyncResult): Promise<void> {
  // Get the newest review date we have
  const { data: newestReview, error: newestError } = await supabaseAdmin
    .from('reviews')
    .select('review_date')
    .eq('business_id', businessId)
    .order('review_date', { ascending: false })
    .limit(1);

  if (newestError) {
    console.error('❌ Error getting newest review:', newestError);
    result.errors.push(`Error getting newest review: ${newestError.message}`);
    return;
  }

  const newestReviewDate = newestReview?.[0]?.review_date
    ? new Date(newestReview[0].review_date)
    : new Date(0); // If no reviews, start from epoch

  console.log(`📅 Incremental sync cutoff: ${newestReviewDate.toISOString()}`);

  let pageToken: string | undefined = undefined;
  let shouldContinue = true;
  let pagesProcessed = 0;
  let consecutiveDuplicates = 0;
  const maxPages = 20; // Reasonable limit for incremental sync

  while (shouldContinue && pagesProcessed < maxPages) {
    try {
      console.log(`📄 Fetching incremental page ${pagesProcessed + 1}`);
      const reviewsResponse = await fetchReviews(businessId, pageToken, 50);

      if (reviewsResponse.reviews && reviewsResponse.reviews.length > 0) {
        let newReviewsInBatch = 0;
        let duplicatesInBatch = 0;
        let oldReviewsInBatch = 0;

        for (const googleReview of reviewsResponse.reviews) {
          try {
            const reviewDate = new Date(googleReview.createTime);

            // Skip reviews older than our newest review
            if (reviewDate <= newestReviewDate) {
              oldReviewsInBatch++;
              consecutiveDuplicates++;

              // If we find many consecutive old reviews, we've caught up
              if (consecutiveDuplicates >= 10) {
                console.log(`⏹️ Found ${consecutiveDuplicates} consecutive old/duplicate reviews, sync complete`);
                shouldContinue = false;
                break;
              }
              continue;
            } else {
              consecutiveDuplicates = 0; // Reset counter
            }

            // Check for duplicates
            const { data: existingReview, error: checkError } = await supabaseAdmin
              .from('reviews')
              .select('id')
              .eq('google_review_id', googleReview.reviewId)
              .single();

            if (checkError && checkError.code !== 'PGRST116') {
              console.error(`❌ Error checking review ${googleReview.reviewId}:`, checkError);
              result.errors.push(`Error checking review: ${checkError.message}`);
              continue;
            }

            if (existingReview) {
              duplicatesInBatch++;
              continue;
            }

            // Insert new review
            const reviewData = mapGoogleReviewToSchema(googleReview, businessId);
            const { error: insertError } = await supabaseAdmin
              .from('reviews')
              .insert(reviewData);

            if (insertError) {
              console.error(`❌ Failed to insert review ${googleReview.reviewId}:`, insertError);
              result.errors.push(`Failed to insert review: ${insertError.message}`);
            } else {
              console.log(`✅ Inserted new review ${googleReview.reviewId} (${reviewDate.toLocaleDateString()})`);
              newReviewsInBatch++;
              result.newReviews++;
            }
          } catch (reviewError) {
            console.error(`❌ Error processing review:`, reviewError);
            result.errors.push(`Error processing review: ${reviewError instanceof Error ? reviewError.message : 'Unknown error'}`);
          }
        }

        result.totalFetched += reviewsResponse.reviews.length;
        pagesProcessed++;

        console.log(`📊 Incremental batch complete: ${newReviewsInBatch} new, ${duplicatesInBatch} duplicates, ${oldReviewsInBatch} old`);

        // Continue pagination if we're still finding new reviews
        if (reviewsResponse.nextPageToken && shouldContinue && newReviewsInBatch > 0) {
          pageToken = reviewsResponse.nextPageToken;
        } else {
          console.log('📄 No more new reviews or pages available');
          shouldContinue = false;
        }
      } else {
        console.log('📄 No reviews in this batch');
        shouldContinue = false;
      }
    } catch (fetchError) {
      console.error('❌ Error fetching incremental page:', fetchError);
      result.errors.push(`Error fetching reviews: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      shouldContinue = false;
    }
  }

  console.log(`⚡ Incremental sync complete: ${result.newReviews} new reviews`);
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
function mapGoogleReviewToSchema(googleReview: GoogleReview, businessId: string): {
  business_id: string;
  google_review_id: string;
  customer_name: string;
  customer_avatar_url: string | null;
  rating: number;
  review_text: string;
  review_date: string;
  status: string;
  ai_reply: string | null;
  final_reply: string | null;
  reply_tone: string;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
} {
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
 * Post reply to Google Business Profile review
 */
export async function postReplyToGoogle(
  businessId: string,
  googleReviewId: string,
  replyText: string
): Promise<{ success: boolean; message: string; error?: string }> {
  console.log('🔄 Starting Google Business Profile reply posting...');

  try {
    // Get business credentials - Platform OAuth pattern (no user credentials needed)
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('google_access_token, google_refresh_token, google_account_id, google_location_id, connection_status')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw new Error('Business not found or credentials missing');
    }

    if (!business.google_access_token || !business.google_account_id || !business.google_location_id) {
      throw new Error('Google Business Profile not connected. Please connect in Settings.');
    }

    if (business.connection_status === 'needs_reconnection') {
      throw new Error('Google Business Profile needs reconnection. Please reconnect in Settings.');
    }

    // Try to decrypt credentials, fallback to plain text if not encrypted - Platform OAuth pattern
    let decrypted;
    try {
      decrypted = decryptFields(business, [
        'google_access_token',
        'google_refresh_token',
        'google_account_id'
        // google_location_id is now stored as plain text
      ]);
      // Add plain text location ID
      decrypted.google_location_id = business.google_location_id;
    } catch {
      // If decryption fails, assume they're stored as plain text (backward compatibility)
      console.log('Using plain text credentials for reply posting (not encrypted)');
      decrypted = {
        google_access_token: business.google_access_token,
        google_refresh_token: business.google_refresh_token,
        google_account_id: business.google_account_id,
        google_location_id: business.google_location_id,
      };
    }

    // Build the reply URL using the EXACT same pattern as reviews URL
    const replyUrl = `https://mybusiness.googleapis.com/v4/accounts/${decrypted.google_account_id}/locations/${decrypted.google_location_id}/reviews/${googleReviewId}/reply`;

    // Request body for the reply
    const requestBody = {
      comment: replyText
    };

    try {
      // Make the PUT request - EXACT same pattern as fetchReviews
      const response = await fetch(replyUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${decrypted.google_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        // Token expired, try to refresh - Platform OAuth pattern
        if (decrypted.google_refresh_token) {
          try {
            const newTokens = await refreshAccessToken(decrypted.google_refresh_token);

            // Store new token - EXACT same pattern as fetchReviews
            const tokenData = { google_access_token: newTokens.access_token };
            const encryptedTokens = encryptFields(tokenData, ['google_access_token']);

            await supabaseAdmin
              .from('businesses')
              .update(encryptedTokens)
              .eq('id', businessId);

            // Retry request with new token - EXACT same pattern as fetchReviews
            const retryResponse = await fetch(replyUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${newTokens.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              console.error('❌ Google API error after token refresh:', retryResponse.status, errorData);

              if (retryResponse.status === 404) {
                return { success: false, message: 'Review not found on Google Business Profile. It may have been deleted.', error: 'REVIEW_NOT_FOUND' };
              } else if (retryResponse.status === 403) {
                return { success: false, message: 'Permission denied. Please check your Google Business Profile permissions.', error: 'PERMISSION_DENIED' };
              } else {
                return { success: false, message: `Google API error: ${retryResponse.status}`, error: 'API_ERROR' };
              }
            }

            console.log('✅ Reply posted to Google Business Profile successfully (after token refresh)');
            return { success: true, message: 'Reply posted successfully to Google Business Profile' };

          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            return { success: false, message: 'Authentication failed. Please reconnect your Google Business Profile.', error: 'TOKEN_REFRESH_FAILED' };
          }
        } else {
          return { success: false, message: 'Authentication expired. Please reconnect your Google Business Profile.', error: 'NO_REFRESH_TOKEN' };
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Google API error:', response.status, errorData);

        if (response.status === 404) {
          return { success: false, message: 'Review not found on Google Business Profile. It may have been deleted.', error: 'REVIEW_NOT_FOUND' };
        } else if (response.status === 403) {
          return { success: false, message: 'Permission denied. Please check your Google Business Profile permissions.', error: 'PERMISSION_DENIED' };
        } else {
          return { success: false, message: `Google API error: ${response.status}`, error: 'API_ERROR' };
        }
      }

      console.log('✅ Reply posted to Google Business Profile successfully');
      return { success: true, message: 'Reply posted successfully to Google Business Profile' };

    } catch (fetchError) {
      console.error('❌ Network error posting reply:', fetchError);
      return { success: false, message: 'Network error. Please check your internet connection and try again.', error: 'NETWORK_ERROR' };
    }

  } catch (error) {
    console.error('❌ Failed to post reply to Google:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Update existing reply to Google Business Profile review
 */
export async function updateReplyToGoogle(
  businessId: string,
  googleReviewId: string,
  replyText: string
): Promise<{ success: boolean; message: string; error?: string }> {
  console.log('🔄 Starting Google Business Profile reply update...');

  try {
    // Get business credentials - Platform OAuth pattern (no user credentials needed)
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('google_access_token, google_refresh_token, google_account_id, google_location_id, connection_status')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      throw new Error('Business not found or credentials missing');
    }

    if (!business.google_access_token || !business.google_account_id || !business.google_location_id) {
      throw new Error('Google Business Profile not connected. Please connect in Settings.');
    }

    if (business.connection_status === 'needs_reconnection') {
      throw new Error('Google Business Profile needs reconnection. Please reconnect in Settings.');
    }

    // Try to decrypt credentials, fallback to plain text if not encrypted - Platform OAuth pattern
    let decrypted;
    try {
      decrypted = decryptFields(business, [
        'google_access_token',
        'google_refresh_token',
        'google_account_id'
        // google_location_id is now stored as plain text
      ]);
      // Add plain text location ID
      decrypted.google_location_id = business.google_location_id;
    } catch {
      // If decryption fails, assume they're stored as plain text (backward compatibility)
      console.log('Using plain text credentials for reply update (not encrypted)');
      decrypted = {
        google_access_token: business.google_access_token,
        google_refresh_token: business.google_refresh_token,
        google_account_id: business.google_account_id,
        google_location_id: business.google_location_id,
      };
    }

    // Build the reply URL using the EXACT same pattern as postReplyToGoogle
    const replyUrl = `https://mybusiness.googleapis.com/v4/accounts/${decrypted.google_account_id}/locations/${decrypted.google_location_id}/reviews/${googleReviewId}/reply`;

    // Request body for the reply update
    const requestBody = {
      comment: replyText
    };

    try {
      // Make the PUT request - Same endpoint as creating, but Google handles update automatically
      const response = await fetch(replyUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${decrypted.google_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        // Token expired, try to refresh - Platform OAuth pattern
        if (decrypted.google_refresh_token) {
          try {
            const newTokens = await refreshAccessToken(decrypted.google_refresh_token);

            // Store new token - EXACT same pattern as postReplyToGoogle
            const tokenData = { google_access_token: newTokens.access_token };
            const encryptedTokens = encryptFields(tokenData, ['google_access_token']);

            await supabaseAdmin
              .from('businesses')
              .update(encryptedTokens)
              .eq('id', businessId);

            // Retry request with new token - EXACT same pattern as postReplyToGoogle
            const retryResponse = await fetch(replyUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${newTokens.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              console.error('❌ Google API error after token refresh:', retryResponse.status, errorData);

              if (retryResponse.status === 404) {
                return { success: false, message: 'Review not found on Google Business Profile. It may have been deleted.', error: 'REVIEW_NOT_FOUND' };
              } else if (retryResponse.status === 403) {
                return { success: false, message: 'Permission denied. Please check your Google Business Profile permissions.', error: 'PERMISSION_DENIED' };
              } else {
                return { success: false, message: `Google API error: ${retryResponse.status}`, error: 'API_ERROR' };
              }
            }

            console.log('✅ Reply updated on Google Business Profile successfully (after token refresh)');
            return { success: true, message: 'Reply updated successfully on Google Business Profile' };

          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            return { success: false, message: 'Authentication failed. Please reconnect your Google Business Profile.', error: 'TOKEN_REFRESH_FAILED' };
          }
        } else {
          return { success: false, message: 'Authentication expired. Please reconnect your Google Business Profile.', error: 'NO_REFRESH_TOKEN' };
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Google API error:', response.status, errorData);

        if (response.status === 404) {
          return { success: false, message: 'Review not found on Google Business Profile. It may have been deleted.', error: 'REVIEW_NOT_FOUND' };
        } else if (response.status === 403) {
          return { success: false, message: 'Permission denied. Please check your Google Business Profile permissions.', error: 'PERMISSION_DENIED' };
        } else {
          return { success: false, message: `Google API error: ${response.status}`, error: 'API_ERROR' };
        }
      }

      console.log('✅ Reply updated on Google Business Profile successfully');
      return { success: true, message: 'Reply updated successfully on Google Business Profile' };

    } catch (fetchError) {
      console.error('❌ Network error updating reply:', fetchError);
      return { success: false, message: 'Network error. Please check your internet connection and try again.', error: 'NETWORK_ERROR' };
    }

  } catch (error) {
    console.error('❌ Failed to update reply on Google:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Test Google Business Profile connection
 */
export async function testConnection(businessId: string): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
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

/**
 * Discover available business locations for the authenticated user
 * Used during platform OAuth setup
 */
export async function discoverUserBusinesses(accessToken: string): Promise<BusinessLocation[]> {
  try {
    console.log('🔍 Discovering user businesses with platform OAuth...');
    const locations = await discoverBusinessLocations(accessToken);
    console.log(`✅ Found ${locations.length} business locations`);
    return locations;
  } catch (error) {
    console.error('❌ Failed to discover user businesses:', error);
    throw new Error(`Failed to discover businesses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate business connection status
 * Checks if the stored credentials are still valid
 */
export async function validateBusinessConnection(businessId: string): Promise<ConnectionStatus> {
  try {
    // Get business credentials
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('google_access_token, google_refresh_token, google_account_id, google_location_id, connection_status, google_business_name, google_location_name')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      return {
        connected: false,
        status: 'error',
        message: 'Business not found',
      };
    }

    if (!business.google_access_token || !business.google_account_id || !business.google_location_id) {
      return {
        connected: false,
        status: 'disconnected',
        message: 'Google Business Profile not connected',
      };
    }

    if (business.connection_status === 'needs_reconnection') {
      return {
        connected: false,
        status: 'needs_reconnection',
        message: 'Connection needs to be renewed',
      };
    }

    // Try to decrypt and validate access
    let decrypted;
    try {
      decrypted = decryptFields(business, [
        'google_access_token',
        'google_account_id'
        // google_location_id is now stored as plain text
      ]);
      // Add plain text location ID
      decrypted.google_location_id = business.google_location_id;
    } catch {
      decrypted = {
        google_access_token: business.google_access_token,
        google_account_id: business.google_account_id,
        google_location_id: business.google_location_id,
      };
    }

    // Test access to the business location
    const hasAccess = await validateBusinessAccess(
      decrypted.google_access_token,
      decrypted.google_account_id,
      decrypted.google_location_id
    );

    if (!hasAccess) {
      // Update status to needs_reconnection
      await supabaseAdmin
        .from('businesses')
        .update({ connection_status: 'needs_reconnection' })
        .eq('id', businessId);

      return {
        connected: false,
        status: 'needs_reconnection',
        message: 'Connection invalid, please reconnect',
      };
    }

    return {
      connected: true,
      status: 'connected',
      message: 'Successfully connected',
      businessInfo: {
        accountId: decrypted.google_account_id,
        accountName: business.google_account_name || 'Unknown Account',
        locationId: decrypted.google_location_id,
        locationName: business.google_location_name || 'Unknown Location',
        businessName: business.google_business_name || 'Unknown Business',
        verified: true, // We'll assume verified since they have access
      },
    };
  } catch (error) {
    console.error('❌ Error validating business connection:', error);
    return {
      connected: false,
      status: 'error',
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Refresh access token for a business
 * Used when token expires during API calls
 */
export async function refreshBusinessToken(businessId: string): Promise<TokenRefreshResult> {
  try {
    // Get refresh token
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('google_refresh_token')
      .eq('id', businessId)
      .single();

    if (error || !business || !business.google_refresh_token) {
      return {
        success: false,
        message: 'No refresh token available. Please reconnect your Google Business Profile.',
      };
    }

    // Decrypt refresh token
    let refreshToken;
    try {
      const decrypted = decryptFields(business, ['google_refresh_token']);
      refreshToken = decrypted.google_refresh_token;
    } catch {
      refreshToken = business.google_refresh_token;
    }

    // Refresh the token using platform credentials
    const newTokens = await refreshAccessToken(refreshToken);

    // Encrypt and store new access token
    const tokenData = { google_access_token: newTokens.access_token };
    const encryptedTokens = encryptFields(tokenData, ['google_access_token']);

    await supabaseAdmin
      .from('businesses')
      .update({
        ...encryptedTokens,
        connection_status: 'connected',
      })
      .eq('id', businessId);

    return {
      success: true,
      message: 'Token refreshed successfully',
      newAccessToken: newTokens.access_token,
    };
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    // Mark as needing reconnection
    await supabaseAdmin
      .from('businesses')
      .update({ connection_status: 'needs_reconnection' })
      .eq('id', businessId);

    return {
      success: false,
      message: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
