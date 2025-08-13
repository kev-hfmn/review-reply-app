# Google Business Profile Reviews Integration Implementation Plan

## 📋 Summary
**Objective**: Integrate Google Business Profile API to fetch reviews using user-supplied OAuth credentials, store in Supabase, and enable manual sync via "Fetch Reviews" button.

**Confidence Level**: ≥ 98% - All research completed, endpoints verified, database schema validated, Make.com workflow analyzed.

**Approach**: User-supplied OAuth credentials (each user provides their own Google Cloud Project credentials)

---

## 🔍 Key Findings

### Current State Analysis
- **Existing Infrastructure**: Database schema already has `google_business_id`, `google_access_token`, `google_refresh_token` fields in `businesses` table
- **Reviews Schema**: Perfect match with GBP API - includes `google_review_id` for deduplication, all required fields present
- **No Existing Google Integration**: Only mock/template integrations in Settings page, ready for real implementation
- **Make.com Workflow**: Uses `google-my-business:watchReviews` module with account/location structure

### API Research Results
- **Current API**: Google Business Profile API (replacing deprecated My Business v4)
- **Base URL**: `https://mybusiness.googleapis.com/v4` (still functional for reviews)
- **Reviews Endpoint**: `accounts/{accountId}/locations/{locationId}/reviews`
- **OAuth Scopes**: `https://www.googleapis.com/auth/business.manage`
- **Key Methods**: `list` (fetch reviews), `get` (individual review)

### Google Cloud Project Requirements
- **Platform Project**: Flowrise Reviews needs a Google Cloud project for redirect URIs
- **User Projects**: Each user must create their own Google Cloud project with Business Profile API enabled
- **No Platform Approval Needed**: Users bring their own API access, bypassing approval process
- **Redirect URI Strategy**: Platform project handles redirects, user projects provide authentication

---

## 🏗 Implementation Architecture

### 1. OAuth Flow (Per-User Credentials)
**Route**: `app/api/auth/google-business/`
- **`initiate/route.ts`**: Start OAuth flow with user's Client ID
- **`callback/route.ts`**: Handle OAuth callback, exchange code for tokens
- **`refresh/route.ts`**: Refresh expired access tokens

**Platform Setup Required**:
- Create Google Cloud Project for Flowrise Reviews (for redirect URIs)
- Set up authorized redirect URIs (e.g., `https://app.flowrise.com/api/auth/google-business/callback`)
- Document user setup process with step-by-step instructions

**User Setup Required** (Each customer must do this):
1. Create their own Google Cloud Project
2. Enable Google Business Profile API in their project
3. Create OAuth 2.0 Client ID/Secret credentials
4. Add our platform's redirect URI to their OAuth consent screen
5. Get their Google Account ID and Location ID from Google Business Profile

**Flow**:
1. User inputs their Client ID/Secret, Account ID, Location ID in Settings → Integrations
2. App initiates OAuth using user's Client ID but our platform redirect URI
3. Google redirects to user's OAuth consent screen (their project)
4. User grants permission, Google redirects back to our callback with authorization code
5. Exchange code for access_token + refresh_token using user's Client Secret
6. Store all credentials encrypted in `businesses` table

### 2. Reviews Fetch System
**Service**: `lib/services/googleBusinessService.ts`
- **`fetchReviews(businessId)`**: Main sync function with pagination
- **`refreshAccessToken(businessId)`**: Handle token refresh per business
- **`parseReviewData()`**: Map GBP API response to our schema
- **`validateCredentials()`**: Test user's Google setup

**API Route**: `app/api/reviews/sync/route.ts`
- Validate user permissions and subscription
- Fetch business credentials from database (decrypt)
- Call Google Business Profile API with user's tokens
- Handle pagination with `pageToken` parameter
- Upsert reviews with deduplication via `google_review_id`
- Return sync status, counts, and any errors

### 3. Database Integration
**Schema Updates Needed** (EXECUTED! DONE!)
```sql
-- Add to businesses table:
ALTER TABLE businesses ADD COLUMN google_client_id TEXT;
ALTER TABLE businesses ADD COLUMN google_client_secret TEXT;
ALTER TABLE businesses ADD COLUMN google_account_id TEXT;
ALTER TABLE businesses ADD COLUMN google_location_id TEXT;
ALTER TABLE businesses ADD COLUMN last_review_sync TIMESTAMP WITH TIME ZONE;
```

**Existing Schema (Perfect for reviews)**:
- **Deduplication**: Use `google_review_id` unique constraint
- **Incremental Sync**: Query by `review_date > last_review_sync`
- **Token Storage**: All credentials encrypted in `businesses` table

### 4. UI Integration
**Settings Page Enhancements** (Integrations Tab):
- Google Business Profile section with setup wizard
- Input fields for: Client ID, Client Secret, Account ID, Location ID
- "Connect Google Business" button → OAuth flow
- Connection status indicator (Connected/Disconnected/Error)
- "Test Connection" and "Disconnect" buttons
- Step-by-step setup instructions with screenshots

**Reviews Page Enhancement**:
- "Fetch Reviews" button in header (enabled when connected)
- Loading states with progress indicator during sync
- Toast notifications for sync results (success/error/counts)
- Last sync timestamp display
- Activity feed updates for sync events

---

## 📊 Data Flow Mapping

### Make.com → App Parity
**Make.com Steps**:
1. `watchReviews` → Batch fetch with limit=99
2. `BasicAggregator` → Process individual reviews
3. `BasicFeeder` → Iterate through reviews
4. Data mapping: name, comment, reviewId, reviewer, createTime, starRating

**App Implementation**:
1. **Batch Fetch**: `GET /v4/accounts/{accountId}/locations/{locationId}/reviews`
2. **Pagination**: Use `pageToken` parameter for large datasets
3. **Field Mapping**:
   ```typescript
   google_review_id: review.reviewId
   customer_name: review.reviewer.displayName
   review_text: review.comment
   rating: review.starRating
   review_date: review.createTime
   customer_avatar_url: review.reviewer.profilePhotoUrl
   ```
4. **Deduplication**: Upsert using `google_review_id` unique constraint

### Incremental Sync Strategy
- **First Sync**: Fetch all reviews (up to API limits)
- **Subsequent Syncs**: Use `review_date > last_review_sync` for efficiency
- **Rate Limiting**: Respect Google's quotas (per user project) with exponential backoff
- **Error Handling**: Graceful degradation with detailed user feedback

---

## 🔧 Technical Implementation

### Required Environment Variables
```bash
# Platform Google Cloud Project (for redirect URIs)
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/google-business/callback

# Encryption key for storing user credentials
CREDENTIALS_ENCRYPTION_KEY=your-secure-encryption-key
```

### File Structure
```
app/api/
├── auth/google-business/
│   ├── initiate/route.ts      # Start OAuth flow
│   ├── callback/route.ts      # Handle OAuth callback
│   └── refresh/route.ts       # Token refresh
└── reviews/
    └── sync/route.ts          # Manual review fetch

lib/services/
├── googleBusinessService.ts   # Core GBP integration
├── encryptionService.ts       # Credential encryption/decryption
└── googleOAuthService.ts      # OAuth flow management

components/
├── GoogleBusinessConnect.tsx  # OAuth connection UI
├── GoogleSetupWizard.tsx      # Step-by-step setup guide
└── ReviewsSyncButton.tsx      # Manual sync trigger

docs/
└── google-setup-guide.md     # User documentation
```

### Error Handling Strategy
- **OAuth Errors**: Clear user feedback with setup troubleshooting
- **API Errors**: Rate limiting, retry logic, meaningful error messages
- **Token Expiry**: Automatic refresh with user notification if refresh fails
- **Invalid Credentials**: Detect and prompt for re-connection
- **Network Issues**: Retry logic with exponential backoff

### Security Considerations
- **Credential Encryption**: All user credentials encrypted at rest
- **Scope Minimization**: Only request `business.manage` scope
- **CSRF Protection**: Use state parameter in OAuth flow
- **Input Validation**: Sanitize all user inputs (Client ID/Secret/IDs)
- **Rate Limiting**: Implement per-user rate limits to prevent abuse

---

## 🎯 Implementation Phases

### Phase 1: Core OAuth Infrastructure
- Database schema updates for credential storage
- Encryption service for sensitive data
- OAuth flow routes with dynamic client credentials
- Settings UI for credential input with setup wizard
- Connection status and testing functionality

### Phase 2: Reviews Fetching
- Google Business Profile API service integration
- Review sync API route with pagination support
- Database upsert logic with proper deduplication
- Comprehensive error handling and user feedback
- Token refresh automation

### Phase 3: UI Integration
- "Fetch Reviews" button integration in Reviews page
- Loading states, progress indicators, and sync status
- Toast notifications for all sync outcomes
- Activity feed integration for sync events
- Last sync timestamp and sync history

### Phase 4: Production Readiness
- User documentation with screenshot guides
- Rate limiting and quota management per user
- Performance monitoring and error alerting
- Integration testing with real Google accounts
- Security audit of credential handling

---

## ✅ Success Criteria
- Users can complete Google Cloud setup following our guide
- OAuth flow works with user-supplied credentials
- Reviews are successfully fetched from Google Business Profile API
- Data is stored correctly in existing Supabase schema
- Manual "Fetch Reviews" button syncs reliably
- Incremental sync prevents duplicates efficiently
- Error states provide helpful guidance to users
- Integration matches Make.com functionality and performance

---

## 🚧 Constraints & Limitations
- **User Setup Complexity**: Each user must create Google Cloud project (documented)
- **Google API Approval**: Users must enable Business Profile API in their project
- **Rate Limits**: Google's API quotas apply per user project (not shared)
- **Location Verification**: Only verified Google Business locations accessible
- **Manual Triggers**: No automatic polling (by design for cost/simplicity)
- **Technical Users**: Requires users comfortable with Google Cloud Console

---

## 📝 User Setup Documentation Required

### Google Cloud Project Setup Guide
1. **Create Project**: Step-by-step Google Cloud Console screenshots
2. **Enable API**: How to enable Google Business Profile API
3. **OAuth Setup**: Creating Client ID/Secret with proper scopes
4. **Redirect URI**: Adding our platform URI to their consent screen
5. **Get IDs**: Finding Account ID and Location ID from Google Business Profile
6. **Troubleshooting**: Common issues and solutions

This plan provides a complete, secure solution that leverages user-supplied credentials to bypass Google's platform approval requirements while maintaining professional functionality and user experience.
