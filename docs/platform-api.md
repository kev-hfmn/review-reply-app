# Google Business Profile Platform-Wide API Integration Plan

## 📋 Overview

**Objective**: Migrate from user-supplied credentials to platform-wide Google Business Profile API access using approved client ID `688794367183-ubujfdvi06m5be62vl2rbrg1s7hguag7.apps.googleusercontent.com`

**Status**: Planning Phase - Complete migration from existing user-credential system to centralized platform OAuth

**Benefits**: 
- Simplified user onboarding (no Google Cloud project setup required)
- Single-click connection flow
- Centralized credential management
- Better user experience and higher conversion rates

---

## 🎯 Implementation Phases

### Phase 1: Environment & Configuration Setup
**Duration**: 1-2 hours
**Dependencies**: Google Cloud Console access, environment configuration

#### 1.1 Environment Variables Configuration
**File**: `.env.local`, `.env.example`

**Add new variables**:
```bash
# Platform-wide Google OAuth credentials
GOOGLE_OAUTH_CLIENT_ID=688794367183-ubujfdvi06m5be62vl2rbrg1s7hguag7.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-platform-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/google-business/callback

# Keep existing
CREDENTIALS_ENCRYPTION_KEY=your-secure-encryption-key
```

**Remove/deprecate**:
- Individual user credential handling variables (if any)

#### 1.2 Google Cloud Console Configuration
**Manual steps required**:
1. Configure authorized redirect URIs in Google Cloud Console
2. Verify OAuth consent screen settings
3. Ensure Google Business Profile API is enabled
4. Test OAuth flow with development URLs

#### 1.3 Environment Validation
**File**: `utils/env.ts`

**Updates needed**:
- Add validation for new platform OAuth variables
- Remove validation for deprecated user credential fields
- Add runtime checks for required Google OAuth configuration

---

### Phase 2: Database Schema Migration
**Duration**: 2-3 hours
**Dependencies**: Supabase access, database migration tools

#### 2.1 Database Schema Changes
**Migration file**: `docs/migrations/migrate_to_platform_oauth.sql`

**Remove columns from `businesses` table**:
```sql
-- Remove user-supplied credential fields
ALTER TABLE businesses DROP COLUMN IF EXISTS google_client_id;
ALTER TABLE businesses DROP COLUMN IF EXISTS google_client_secret;
```

**Add/modify columns**:
```sql
-- Add platform-specific fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_account_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_business_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_location_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_connection_attempt TIMESTAMP WITH TIME ZONE;

-- Ensure existing fields are properly configured
-- google_access_token (already exists, encrypted)
-- google_refresh_token (already exists, encrypted)  
-- google_account_id (already exists)
-- google_location_id (already exists)
-- last_review_sync (already exists)
-- initial_backfill_complete (already exists)
```

#### 2.2 Data Migration Strategy
**Considerations**:
- Existing users with user-supplied credentials need migration path
- Preserve existing review data and sync history
- Handle businesses that need to reconnect with new OAuth flow

**Migration steps**:
1. Backup existing credential data
2. Mark all existing connections as `needs_reconnection`
3. Clear old credential fields
4. Notify users of required reconnection

---

### Phase 3: OAuth Service Layer Updates
**Duration**: 4-6 hours
**Dependencies**: Google Auth Library, existing encryption service

#### 3.1 Google OAuth Service Refactoring
**File**: `lib/services/googleOAuthService.ts`

**Major changes required**:
```typescript
// Remove dynamic client credential handling
// Replace with fixed platform credentials

export class GoogleOAuthService {
  private readonly clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  private readonly clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
  private readonly redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI!;
  
  // Remove: getUserCredentials(), validateUserCredentials()
  // Update: generateAuthUrl(), exchangeCodeForTokens()
  // Add: discoverBusinessLocations(), getBusinessInfo()
}
```

**New methods to implement**:
- `discoverBusinessLocations(accessToken: string)`: Fetch user's business locations
- `getBusinessInfo(accountId: string, locationId: string)`: Get business details
- `validateBusinessAccess(accessToken: string, locationId: string)`: Verify permissions

#### 3.2 Google Business Service Updates
**File**: `lib/services/googleBusinessService.ts`

**Updates required**:
- Remove dynamic credential decryption logic
- Use platform credentials for all API calls
- Update token refresh mechanism
- Add business location discovery integration

**Key method updates**:
```typescript
// Update existing methods
export async function refreshAccessToken(businessId: string): Promise<TokenRefreshResult>
export async function fetchReviews(businessId: string, userId: string, options?: SyncOptions): Promise<SyncResult>
export async function postReplyToGoogle(businessId: string, googleReviewId: string, replyText: string): Promise<PostReplyResult>

// Add new methods
export async function discoverUserBusinesses(accessToken: string): Promise<BusinessLocation[]>
export async function validateBusinessConnection(businessId: string): Promise<ConnectionStatus>
```

---

### Phase 4: API Routes Refactoring
**Duration**: 3-4 hours
**Dependencies**: Updated OAuth service, database schema

#### 4.1 OAuth Flow Routes
**Files**: 
- `app/api/auth/google-business/initiate/route.ts`
- `app/api/auth/google-business/callback/route.ts`
- `app/api/auth/google-business/refresh/route.ts`

**Major changes**:

**Initiate Route**:
```typescript
// Remove: Dynamic client ID handling
// Add: Fixed platform OAuth URL generation
// Add: Business location discovery after OAuth
```

**Callback Route**:
```typescript
// Remove: User credential validation
// Add: Automatic business location fetching
// Add: Business info population
// Update: Database storage logic
```

**Refresh Route**:
```typescript
// Simplify: Use platform credentials only
// Remove: User credential decryption
```

#### 4.2 New API Routes
**File**: `app/api/auth/google-business/locations/route.ts`

**Purpose**: Fetch available business locations for user selection

```typescript
// GET /api/auth/google-business/locations
// Returns: Array of business locations user has access to
// Used by: Settings page for location selection dropdown
```

**File**: `app/api/auth/google-business/disconnect/route.ts`

**Purpose**: Disconnect Google Business Profile integration

```typescript
// POST /api/auth/google-business/disconnect
// Action: Clear tokens, reset connection status
// Used by: Settings page disconnect functionality
```

---

### Phase 5: Frontend Integration Updates
**Duration**: 6-8 hours
**Dependencies**: Updated API routes, UI components

#### 5.1 Settings Page Overhaul
**File**: `app/(app)/settings/page.tsx`

**Major UI changes required**:

**Remove**:
- Google Cloud project setup instructions
- Client ID/Secret input fields
- Account ID/Location ID manual entry
- Complex setup wizard

**Add**:
- Simple "Connect Google Business Profile" button
- Business location selection dropdown (after connection)
- Connection status display with business info
- Disconnect/Reconnect functionality

**New component structure**:
```typescript
// Google Business Profile Integration Section
<GoogleBusinessProfileSection>
  <ConnectionStatus />
  {!connected && <ConnectButton />}
  {connected && (
    <>
      <BusinessInfo />
      <LocationSelector />
      <DisconnectButton />
    </>
  )}
</GoogleBusinessProfileSection>
```

#### 5.2 New UI Components
**File**: `components/GoogleBusinessProfileIntegration.tsx`

**Components to create**:
- `ConnectionStatus`: Display connection state and business info
- `ConnectButton`: Initiate OAuth flow
- `LocationSelector`: Dropdown for multi-location businesses
- `BusinessInfo`: Show connected business details
- `DisconnectButton`: Disconnect integration

#### 5.3 Hook Updates
**File**: `hooks/useReviewsData.ts`

**Updates needed**:
- Remove user credential management
- Add connection status tracking
- Update error handling for new OAuth flow
- Add location selection state management

---

### Phase 6: User Experience Enhancements
**Duration**: 4-5 hours
**Dependencies**: Updated frontend components

#### 6.1 Onboarding Flow Simplification
**Files**: 
- `app/(app)/dashboard/page.tsx`
- `components/OnboardingCard.tsx`

**Changes**:
- Remove Google API approval step complexity
- Replace with simple "Connect your Google Business Profile"
- Add progress indicators for OAuth flow
- Update success messaging

#### 6.2 Error Handling & User Guidance
**Files**: 
- `components/ErrorBoundary.tsx` (if exists)
- `lib/errors/googleBusinessErrors.ts` (new)

**Error scenarios to handle**:
- Business not verified on Google
- Insufficient permissions
- Multiple locations requiring selection
- Connection expired/invalid
- API rate limiting

**User guidance for**:
- Business verification requirements
- Permission explanations
- Troubleshooting connection issues

#### 6.3 Toast Notifications & Feedback
**Updates to existing toast system**:
- Connection success with business name
- Location selection confirmation
- Disconnection confirmation
- Error messages with actionable guidance

---

### Phase 7: Testing & Validation
**Duration**: 3-4 hours
**Dependencies**: All previous phases completed

#### 7.1 OAuth Flow Testing
**Test scenarios**:
- Fresh user connection (no existing data)
- Existing user migration (has old credentials)
- Multi-location business selection
- Single location auto-selection
- Permission denied scenarios
- Token refresh functionality

#### 7.2 Integration Testing
**Test areas**:
- Review fetching with new OAuth
- Reply posting with platform credentials
- Business location discovery
- Error handling and recovery
- Database migration validation

#### 7.3 User Experience Testing
**Validation points**:
- Onboarding flow simplicity
- Settings page functionality
- Connection status accuracy
- Error message clarity
- Mobile responsiveness

---

### Phase 8: Documentation & Deployment
**Duration**: 2-3 hours
**Dependencies**: Testing completed

#### 8.1 Documentation Updates
**Files to update**:
- `README.md`: Update setup instructions
- `docs/api.md`: Document new OAuth flow
- `CLAUDE.md`: Update architecture notes
- User-facing help documentation

#### 8.2 Environment Configuration
**Production setup**:
- Configure production OAuth redirect URIs
- Set up environment variables in deployment platform
- Test OAuth flow in staging environment
- Validate SSL certificate for redirect URIs

#### 8.3 Migration Communication
**User communication plan**:
- In-app notification about simplified connection
- Email to existing users about reconnection requirement
- Help documentation for new connection process
- Support team briefing on changes

---

## 🔧 Technical Dependencies

### Required Libraries
- `google-auth-library`: OAuth 2.0 client (already installed)
- `googleapis`: Google Business Profile API client
- Existing: `crypto` for encryption, `supabase` for database

### Environment Requirements
- Google Cloud Console access for OAuth configuration
- Supabase database access for schema migration
- Deployment platform environment variable configuration

### API Endpoints Used
- `https://mybusiness.googleapis.com/v4/accounts` - Account discovery
- `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations` - Location listing
- `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}` - Business info
- `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews` - Reviews
- `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply` - Reply posting

---

## 🚨 Migration Considerations

### Breaking Changes
- Existing users must reconnect their Google Business Profile
- Old credential fields will be removed from database
- Settings page UI will be completely redesigned

### Backward Compatibility
- Preserve existing review data and sync history
- Maintain existing encryption for stored tokens
- Keep existing review management workflow intact

### Rollback Plan
- Database migration can be reversed if needed
- Old credential fields can be restored
- Feature flag for switching between old/new OAuth flow during transition

---

## 📊 Success Metrics

### Technical Metrics
- OAuth connection success rate > 95%
- Token refresh success rate > 99%
- API error rate < 1%
- Page load time for settings < 2s

### User Experience Metrics
- Onboarding completion rate increase
- Support tickets related to Google setup decrease
- User satisfaction with connection process
- Time to complete Google Business Profile connection

---

## 🎯 Implementation Timeline

**Total Estimated Duration**: 25-35 hours

**Week 1**: Phases 1-3 (Environment, Database, Services)
**Week 2**: Phases 4-5 (API Routes, Frontend)
**Week 3**: Phases 6-8 (UX, Testing, Deployment)

**Critical Path**: Database migration → OAuth service updates → Frontend integration

**Risk Mitigation**: Implement feature flag to allow gradual rollout and quick rollback if issues arise.
