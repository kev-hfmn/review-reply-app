# Flowrise Reviews — Implementation Plan

Goal: Build and launch the MVP of Flowrise Reviews — a SaaS dashboard that lets small businesses approve AI-generated replies to Google reviews, post them via Make.com, and see a weekly digest.
We start with mocked data and workflows, then connect to the real Google Business API and Supabase database.

## 🎯 Current Status (Updated: August 2025)

**✅ COMPLETED PHASES:**
- **Phase 1**: Page Structure and Navigation - DONE
  - All 5 pages created in `app/(app)/` route group
  - Protected routes implemented with AuthContext
  - TopBar with app name, theme toggle, user menu
  - Sidebar with navigation to all pages
  - AppShell layout combining TopBar, Sidebar, and content
  - Working navigation between all pages

- **Phase 2**: Dashboard Page - DONE
  - KPI cards with metrics (reviews, replies, ratings, pending approvals)
  - Interactive reviews chart with mock data visualization
  - Recent activity feed showing user actions
  - Onboarding card with Google API approval workflow
  - Real-time data integration with Supabase
  - Custom hooks for dashboard data management

- **Phase 3**: Reviews Page (Core Workflow) - DONE
  - Complete filtering system (rating, status, date range, search)
  - Interactive reviews table with all required columns
  - Inline editing of AI-generated replies
  - Bulk selection and actions (approve, post selected)
  - Detailed review drawer for editing and tone selection
  - Toast notifications for all user actions
  - Status management (pending, approved, posted, needs edit)
  - Integration with dashboard metrics and activity feed

- **Phase 4**: Digest Page - DONE
  - Weekly overview with date range display
  - KPI cards: total reviews, average rating, response rate, unique customers
  - Week-over-week change indicators with trending icons
  - Interactive rating breakdown with visual progress bars
  - Positive themes and improvement areas with color-coded badges
  - Review highlights section with best/worst/notable reviews
  - Export functionality: Send email, Download PDF, Download CSV
  - Responsive design with smooth animations and loading states
  - Mock data integration ready for Supabase connection

- **Phase 5**: Settings Page - DONE
  - Tabbed interface with 5 main sections
  - Business Profile: name, location, industry, Google Business ID
  - Brand Voice Configuration: presets and custom sliders (formality, warmth, brevity)
  - Approval Mode: manual, auto-approve 4+, auto-approve except low ratings
  - Integrations: Google Business Profile and Make.com webhook management
  - Billing: current plan display with upgrade and billing management options
  - Real-time status indicators and connection management
  - Form validation and save functionality with loading states
  - Mock data integration ready for Supabase connection

**✅ COMPLETED:**
- **All 5 Core Pages**: Dashboard, Reviews, Digest, Settings, Help
- **Complete Navigation**: Working routing and protected routes
- **Database Schema**: Full schema with RLS policies deployed
- **Mock Data Integration**: All pages working with realistic mock data
- **UI/UX Polish**: Responsive design, animations, loading states, error handling

**📋 NEXT STEPS:**
- Connect to real Supabase database and replace mock data
- Implement Google Business API integration
- Set up Make.com webhook endpoints
- Deploy to production environment
- Add real authentication and subscription management

---

## Features Overview

**Core Value:**
Automate the review management process for small businesses by:
- Fetching new Google reviews
- Generating on-brand AI replies instantly
- Allowing easy approval/editing
- Posting replies automatically
- Sending a weekly digest with key insights

**MVP Feature List:**
1. **Authentication & Access Control**
   - Supabase Auth with Google OAuth
   - Protected routes for logged-in users
   - Subscription/trial gating via Stripe

2. **Dashboard (Overview)**
   - KPI cards: Reviews this week, Replies posted, Avg rating (30d), Pending approvals
   - Mini chart showing reviews over time
   - Activity feed of recent actions
   - Onboarding checklist with Google API approval step

3. **Reviews Management**
   - Filter reviews by rating, status, date range, keyword
   - See review text + suggested AI reply
   - Edit replies inline or in a detail view
   - Approve or post replies individually or in bulk
   - Regenerate reply with tone presets (Friendly, Professional, Playful)
   - Status tracking (Pending, Approved, Posted, Needs edit)
   - Toast notifications for all actions

4. **Weekly Digest**
   - Ratings breakdown for the week
   - Positive & improvement themes
   - Highlights of notable reviews
   - Buttons to send weekly email, download PDF/CSV

5. **Settings**
   - Business profile (name, location, industry)
   - Brand voice configuration (presets + sliders)
   - Approval mode: manual, auto-approve ≥4★, auto-approve all except 1–2★
   - Integrations:
     - Google Business API connection & status
     - Make.com webhook setup + test
   - Billing: link to Stripe customer portal

6. **Help Page**
   - Short FAQ
   - Support email link

7. **Polish & UX**
   - Light/dark mode toggle
   - Mobile-friendly design
   - Empty states for pages with no data
   - Smooth transitions and hover states
   - Rounded cards, subtle shadows, clean typography

**Phase 2+ (Post-MVP Enhancements):**
- Real-time sync with Google Business API
- Automated review fetching
- Scheduled email digests
- Multi-business management for agencies
- Multi-user support per business
- Export advanced analytics

---

## Phase 1 — Page Structure and Navigation

**Objective:** Set up the pages and navigation skeleton before building any functionality.

**Pages to create:**
- Dashboard (overview)
- Reviews (core workflow)
- Digest (weekly summaries)
- Settings (profile, preferences, integrations)
- Help (FAQ + support)

**Steps:**
1. Create a new route group under `app/(app)/` for the pages above.
2. Wrap all pages with:
   - `ProtectedRoute` (so only logged-in users can access)
   - Subscription/trial checks from your boilerplate.
3. Build a **Topbar**:
   - App name (“Flowrise Reviews”)
   - Light/dark mode toggle
   - User menu (Account, Billing, Sign out)
4. Build a **Sidebar**:
   - Links to the 5 pages
   - Collapsible on mobile
5. Create an **AppShell** layout that combines the Topbar, Sidebar, and main content area.
6. Test navigation between all pages.

---

## Phase 2 — Dashboard Page

**Objective:** Create a high-level overview of review activity and onboarding.

**Key Sections:**
- KPI cards:
  - Reviews this week
  - Replies posted
  - Average rating (last 30 days)
  - Pending approvals
- Small line/area chart: Reviews per day (last 14 days)
- Recent activity list
- Onboarding steps card:
  1. Approve Google access (5-minute form)
  2. Pick your brand voice
  3. Start auto-replies

**Steps:**
1. Design KPI cards with clear numbers and short labels.
2. Add a static chart with mock review data.
3. Create a simple activity feed (e.g., “Reply posted to 5-star review from Jane”).
4. Build the onboarding card:

   - Each step has a short description.
   - “Approve Google access” step opens a modal with:
     - Copy: “Google requires a one-time 5-minute approval so we can post replies on your behalf. We guide you through it.”
     - Checklist: Submitted form → Awaiting approval → Approved

---

## Phase 3 — Reviews Page (Core Workflow)

**Objective:** The main table where users see reviews, approve replies, and post them.

**Key Features:**
- Filters for rating, status, date range, search by text/author.
- Table with:
  - Rating (stars)
  - Customer (name + date)
  - Review text (truncated)
  - Suggested AI reply (editable inline)
  - Status badge (Pending/Approved/Posted/Needs edit)
  - Actions: Approve, Edit, Post, Skip
- Bulk actions: Approve selected, Post selected
- Drawer (slide-out panel) for detailed editing:
  - Full review text
  - Editable suggested reply
  - Tone selector (Friendly, Professional, Playful)
  - Buttons: Regenerate reply, Approve, Post
- Toast notifications after every action.

**Steps:**
1. Create filters UI and ensure it updates the table.
2. Populate the table with mock reviews.
3. Make the Suggested Reply field editable in place.
4. Add bulk selection checkboxes and action buttons.
5. Build the Drawer for detailed review editing.
6. Connect all actions to mock “approve”, “post”, and “regenerate” functions.
7. Update the Dashboard KPIs and activity list whenever actions are taken.

---

## Phase 4 — Digest Page

**Objective:** Show a weekly summary of review trends.

**Key Sections:**
- Counts by rating (5, 4, 3, 2, 1 stars)
- Positive themes (chips/pills)
- Improvement themes (chips/pills)
- Highlights list (best/worst reviews of the week)
- Buttons:
  - Send weekly email now
  - Download PDF
  - Download CSV

**Steps:**
1. Display mock summary data in a clean card layout.
2. Style the themes as small pill buttons for readability.
3. Add buttons with stub actions for email/PDF/CSV.
4. Make sure this page also works on mobile.

---

## Phase 5 — Settings Page

**Objective:** Let the user configure their business profile, brand voice, approval mode, and integrations.

**Sections:**
1. **Business profile**: Name, location, industry.
2. **Brand voice**:
   - Presets (Friendly, Professional)
   - Sliders for formality, warmth, brevity
3. **Approval mode**:
   - Manual (default)
   - Auto-approve ≥4-star reviews
   - Auto-approve all except 1–2 stars
4. **Integrations**:
   - Google Business:
     - Connection status (Not connected / Submitted / Approved)
     - “Approve Google access” modal (same as Dashboard)
   - Make.com:
     - Webhook URL input
     - “Test connection” button
5. **Billing**:
   - Link to Stripe customer portal from boilerplate

**Steps:**
1. Build each section with clear form elements.
2. For MVP, save changes in local state.
3. Make the Google API step part of onboarding and integrations.

---

## Phase 6 — Help Page

**Objective:** Provide quick answers and support contact.

**Content:**
- Short FAQ (3–5 questions)
  - “Will replies sound robotic?”
  - “Can I edit before posting?”
  - “How long is setup?”
  - “What if Google hasn’t approved yet?”
- Support email or link to contact form.

**Steps:**
1. Format as an accordion or simple list.
2. Add a contact link.

---

## Phase 7 — Polish & Gating

**Objective:** Make it look and feel professional.

**Tasks:**
1. Add light/dark mode toggle functionality.
2. Style with rounded cards, subtle shadows, white space.
3. Ensure all pages are mobile-friendly.
4. Add empty states:
   - Reviews: “No reviews yet” + button to import sample data
   - Digest: Show placeholder until data is available
5. Integrate subscription gating:
   - Block Approve/Post actions for inactive subscriptions
   - Show upgrade/paywall card linking to Stripe checkout

---

## Phase 1.5 — Database Setup (Current Priority)

**Objective:** Set up Supabase database schema to prepare for mock data integration.

**Database Schema Design:**

### Core Tables

1. **businesses**
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to auth.users)
   - `name` (text)
   - `location` (text)
   - `industry` (text)
   - `google_business_id` (text, nullable)
   - `google_access_token` (text, nullable, encrypted)
   - `google_refresh_token` (text, nullable, encrypted)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **reviews**
   - `id` (uuid, primary key)
   - `business_id` (uuid, foreign key)
   - `google_review_id` (text, unique)
   - `customer_name` (text)
   - `customer_avatar_url` (text, nullable)
   - `rating` (integer, 1-5)
   - `review_text` (text)
   - `review_date` (timestamp)
   - `status` (enum: 'pending', 'approved', 'posted', 'needs_edit', 'skipped')
   - `ai_reply` (text, nullable)
   - `final_reply` (text, nullable)
   - `reply_tone` (text, default: 'friendly')
   - `posted_at` (timestamp, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

3. **business_settings**
   - `id` (uuid, primary key)
   - `business_id` (uuid, foreign key, unique)
   - `brand_voice_preset` (text, default: 'friendly')
   - `formality_level` (integer, 1-10, default: 5)
   - `warmth_level` (integer, 1-10, default: 7)
   - `brevity_level` (integer, 1-10, default: 5)
   - `approval_mode` (enum: 'manual', 'auto_4_plus', 'auto_except_low')
   - `make_webhook_url` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. **activities**
   - `id` (uuid, primary key)
   - `business_id` (uuid, foreign key)
   - `type` (enum: 'review_received', 'reply_posted', 'reply_approved', 'settings_updated')
   - `description` (text)
   - `metadata` (jsonb, nullable)
   - `created_at` (timestamp)

5. **weekly_digests**
   - `id` (uuid, primary key)
   - `business_id` (uuid, foreign key)
   - `week_start` (date)
   - `week_end` (date)
   - `total_reviews` (integer)
   - `rating_breakdown` (jsonb) -- {1: 0, 2: 1, 3: 2, 4: 5, 5: 12}
   - `positive_themes` (text[])
   - `improvement_themes` (text[])
   - `highlights` (jsonb) -- array of notable reviews
   - `generated_at` (timestamp)
   - `created_at` (timestamp)

### Row Level Security (RLS) Policies

All tables will have RLS enabled with policies ensuring users can only access data for businesses they own.

**Steps:**
1. Create tables using MCP Supabase
2. Set up RLS policies
3. Create indexes for performance
4. Generate mock data that follows this schema structure
5. Update components to work with database structure

## Phase 8 — Connect Real Integrations (Phase 2)

**Objective:** Switch from mocks to live data.

**Steps:**
1. Google Business API:
   - Implement OAuth flow for the client to grant posting access
   - Store tokens in Supabase (already structured in schema)
   - Fetch new reviews regularly and insert them
2. Make.com:
   - Replace mock "post" function with a webhook call to Make.com
3. Weekly digest:
   - Generate summaries from real reviews using database data
   - Email via your chosen provider

---

## Phase 9 — Launch

**Steps:**
1. Switch `NEXT_PUBLIC_FEATURE_USE_MOCKS` to `false`.
2. Deploy to Vercel.
3. Test end-to-end with one real business account.
4. Collect feedback, fix bugs, iterate.

---

**Reminder:** Keep each phase small and shippable. Do not add extra features before finishing the current phase.
