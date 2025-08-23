# Multi-Business Location Support Implementation Plan

## =Ë Overview

**Objective**: Implement full support for users with multiple Google Business Profile locations, enabling selection during connection and switching between businesses.

**Current State**: Platform discovers all user business locations but auto-selects the first one without user choice.

**Target State**: Complete business location selection and switching functionality with preserved user experience.

---

## = Research Findings

###  **Existing Technical Foundation**
- **Google Business Discovery**: `discoverBusinessLocations()` function already fetches all user's business locations
- **Multi-Location Detection**: OAuth callback detects multiple locations and logs them
- **Data Structure**: `BusinessLocation` interface supports full business metadata
- **API Integration**: All Google Business Profile APIs work with any location ID

### L **Current Limitations**
- **Auto-Selection**: System automatically picks first location without user input
- **No Switching**: No UI for changing connected business after initial connection
- **Single Business Model**: Database and UI assume one business per user
- **Missing UX**: No business selection interface during OAuth flow

### =Ê **Database Schema Analysis**
- **Current Model**: `businesses` table ’ `user_id` (1:1 relationship)
- **Related Tables**: All data tied to single `business_id` (reviews, settings, activities, digests)
- **OAuth Storage**: Stores single location's tokens and IDs per user
- **Schema Flexibility**: Current structure can support business switching via reconnection

---

## <¯ Implementation Plan

### Phase 1: Business Location Selection UI (4-6 hours)

#### 1.1 Create Location Selection Page
**File**: `app/auth/google-business/select-location/page.tsx`

**Features**:
- Display all discovered business locations in a clean grid layout
- Show business name, address, verification status for each location
- Visual indicators for verified vs unverified businesses
- Search/filter functionality if many locations
- "Connect This Business" button for each location

**Component Structure**:
```typescript
interface LocationSelectionPageProps {
  locations: BusinessLocation[];
  temporaryTokens: string; // Encrypted session data
}

// Grid of location cards with:
// - Business name and address
// - Verification badge
// - Connect button
// - Preview of business info
```

#### 1.2 Update OAuth Callback Flow
**File**: `app/api/auth/google-business/callback/route.ts`

**Changes Required**:
```typescript
// Current logic (line 64-82):
if (locations.length > 1) {
  // Store tokens temporarily and redirect to location selection
  console.log('= Multiple locations found, need location selection...');
  // For now, just use the first one - location selection UI will be implemented later
}

// New logic:
if (locations.length > 1) {
  // Store tokens temporarily in session/database
  // Redirect to location selection page with locations data
  return redirect('/auth/google-business/select-location?session=encrypted_token_data');
} else {
  // Single location - auto-connect as current behavior
  // Continue with existing logic
}
```

#### 1.3 Temporary Token Storage
**File**: `lib/services/temporarySessionService.ts` (new)

**Purpose**: Securely store OAuth tokens during location selection process

**Features**:
- Encrypt and store tokens with expiration (15 minutes)
- Associate with user session
- Clean up expired sessions automatically
- Provide tokens to complete connection after selection

#### 1.4 Location Selection API
**File**: `app/api/auth/google-business/complete-connection/route.ts`

**Purpose**: Complete connection after user selects a business location

**Flow**:
1. Receive selected location ID and temporary session token
2. Decrypt stored OAuth tokens
3. Complete business connection with selected location
4. Clear temporary session data
5. Redirect to Settings with success message

---

### Phase 2: Business Switching Functionality (3-4 hours)

#### 2.1 Enhanced Settings Integration
**File**: `components/GoogleBusinessProfileIntegration.tsx`

**Add Business Info Display**:
- Show currently connected business name and location
- Display address and verification status
- Add "Switch Business" button when connected

**New Components**:
```typescript
// Business info card showing current connection
<ConnectedBusinessCard 
  businessName={business.google_business_name}
  locationName={business.google_location_name}
  verified={business.verified}
  onSwitchBusiness={() => handleSwitchBusiness()}
/>

// Switch business confirmation modal
<SwitchBusinessModal 
  currentBusiness={currentBusiness}
  onConfirm={() => initiateSwitchFlow()}
  onCancel={() => setShowSwitchModal(false)}
/>
```

#### 2.2 Business Switching API
**File**: `app/api/auth/google-business/switch/route.ts`

**Purpose**: Initiate business switching process

**Flow**:
1. Clear current business tokens and connection
2. Start new OAuth flow for business selection
3. Preserve review history with business switch audit trail
4. Update business_settings to maintain configuration

#### 2.3 Data Preservation Strategy
**Approach**: Maintain existing single-business-per-user model with switching

**Data Handling**:
- **Reviews**: Keep all existing reviews when switching (historical data)
- **Settings**: Preserve brand voice and approval settings across switches
- **Activities**: Add "business_switched" activity type for audit trail
- **Sync History**: Reset sync timestamps for new business location

---

### Phase 3: Enhanced User Experience (2-3 hours)

#### 3.1 Business Context Display
**Files**: `components/TopBar.tsx`, `components/Sidebar.tsx`

**Enhancements**:
- Display current business name in sidebar header
- Add business verification badge/indicator
- Show "Not Connected" state when no business linked

#### 3.2 Improved Settings Flow
**File**: `app/(app)/settings/page.tsx`

**Integration Tab Updates**:
- Prominent display of current connected business
- Clear business switching workflow
- Better error handling for connection issues
- Success states after business selection/switching

#### 3.3 Dashboard Context Updates
**File**: `app/(app)/dashboard/page.tsx`

**Business Context**:
- Show business name in dashboard header
- Display location-specific KPIs and metrics
- Add business connection status to onboarding card

---

### Phase 4: Advanced Features (Optional - 2-3 hours)

#### 4.1 Business History Management
**File**: `app/(app)/settings/business-history/page.tsx` (new)

**Features**:
- Show history of connected businesses
- Allow reconnection to previously connected businesses
- Display switch timestamps and reasons
- Data export for historical business data

#### 4.2 Enhanced Business Discovery
**File**: `lib/services/googleBusinessService.ts`

**Additional Features**:
- Cache business location discovery results
- Refresh business list functionality
- Handle business verification status changes
- Monitor for new locations added to user's Google account

#### 4.3 Multi-Location Analytics
**Future Enhancement**: Dashboard and Digest pages could be enhanced to show:
- Business-specific metrics and comparisons
- Location performance insights
- Cross-business trend analysis

---

## <× Technical Architecture

### Database Schema Approach
**Strategy**: Maintain current single-business model with switching support

**No Schema Changes Required**:
- Current `businesses` table supports one active business per user
- Business switching replaces connection rather than adding multiple records
- All existing relationships and constraints remain functional

**Optional Enhancements**:
```sql
-- Track business switching history (optional)
CREATE TABLE business_connection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  google_location_id TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  switch_reason TEXT
);
```

### Session Management
**Temporary Token Storage**:
- Use encrypted session storage for OAuth flow
- 15-minute expiration for security
- Clean up expired sessions automatically
- Associate with user session for security

### API Architecture
**New Endpoints Required**:
- `GET /api/auth/google-business/locations?session=token` - Get locations for selection
- `POST /api/auth/google-business/complete-connection` - Complete connection with selected location
- `POST /api/auth/google-business/switch` - Initiate business switching
- `GET /api/businesses/current` - Get current business context for UI display

---

## =§ Implementation Considerations

### User Experience Flow
1. **First Connection**: User connects ’ discovers multiple locations ’ selects one ’ completes setup
2. **Business Switching**: User clicks "Switch Business" ’ re-authenticates ’ selects different location ’ preserves settings
3. **Single Location**: Users with one location continue with current seamless flow

### Data Migration Strategy
**Backward Compatibility**:
- Existing single-business users continue working without changes
- New multi-business features are additive, not disruptive
- No database migration required for existing data

### Error Handling
**Connection Issues**:
- Handle businesses that become unverified
- Manage revoked Google access gracefully
- Provide clear guidance for permission issues
- Support reconnection when businesses are restored

---

## ñ Implementation Timeline

### Phase 1: Core Location Selection (4-6 hours)
- Location selection page creation
- OAuth callback updates
- Temporary token management
- Connection completion API

### Phase 2: Business Switching (3-4 hours)
- Switch business functionality
- Enhanced settings integration
- Data preservation logic
- Audit trail implementation

### Phase 3: UX Polish (2-3 hours)
- Business context display throughout app
- Improved connection status indicators
- Enhanced error handling and messaging
- Mobile responsiveness

### Phase 4: Advanced Features (2-3 hours, Optional)
- Business history tracking
- Enhanced discovery and caching
- Analytics and reporting enhancements
- Cross-business insights

**Total Estimated Time**: 11-16 hours for complete implementation

---

## <¯ Success Criteria

### Technical Requirements
-  Users can select from multiple business locations during connection
-  Users can switch between different businesses seamlessly
-  All existing functionality preserved during business switching
-  Proper error handling for connection edge cases
-  Security maintained for temporary token storage

### User Experience Requirements
-  Clear visual indication of currently connected business
-  Intuitive business selection interface
-  Seamless switching without data loss
-  Helpful guidance for business verification issues
-  Mobile-responsive design for all new components

### Business Requirements
-  Support users with multiple business locations
-  Maintain data integrity across business switches
-  Preserve user settings and preferences
-  Enable easy reconnection to previously used businesses
-  Provide audit trail for business connection changes

---

## =€ Next Steps

1. **Immediate Need**: Implement Phase 1 (Location Selection) to remove auto-selection limitation
2. **User Request**: Add Phase 2 (Business Switching) for complete multi-business support
3. **Enhancement**: Consider Phase 4 features based on user feedback and business requirements

The foundation is solid and the implementation path is clear. The multi-business support can be delivered incrementally without breaking existing functionality.