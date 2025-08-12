# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Environment Setup
- Copy `.env.example` to `.env.local` and configure all required environment variables
- Requires Supabase, Stripe, and PostHog configuration for full functionality

## Architecture Overview

This is a Next.js 15 full-stack SaaS application for **Flowrise Reviews** - a review management platform that helps small businesses manage Google reviews with AI-generated replies. The application has completed Phases I-III of development with the following key architectural patterns:

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS with custom configuration
- **UI Components**: Shadcn UI (shadcn@latest) with custom configuration
- **Authentication**: Supabase Auth with Google OAuth integration
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe integration with subscription management
- **Analytics**: Vercel Analytics (PostHog commented out)
- **State Management**: React Context for auth and subscription state

### Core Architecture Patterns

#### Authentication Flow
- **AuthContext** (`contexts/AuthContext.tsx`) - Central authentication state management
  - Manages user sessions, subscription status, and auth operations
  - Includes subscription checking logic with real-time updates
  - Handles soft-delete account reactivation
- **ProtectedRoute** (`contexts/ProtectedRoute.tsx`) - Route protection wrapper
- Authentication pages: login, reset-password, update-password, verify-email

#### Subscription Management
- Stripe webhook handlers in `app/api/stripe/` for subscription lifecycle events
- Real-time subscription status checking in AuthContext
- Subscription status affects access control throughout the app
- Trial period management with user_trials table

#### API Structure
- **Stripe API routes**: `/api/stripe/` for webhook handling, sync, test, cancel, reactivate
- **User API routes**: `/api/user/delete` for account management
- **Config**: `config/api.ts` defines external API endpoints (separate backend at localhost:8080)

#### Database Schema
- Users table with soft-delete functionality (is_deleted, deleted_at fields)
- Subscriptions table with Stripe integration
- User preferences and trials tables
- Database trigger function handles new user creation automatically

#### Component Organization
- **Contexts**: AuthContext, PostHogContext, ProtectedRoute
- **Hooks**: useSubscription, useTrialStatus for subscription-related state
- **Components**: Reusable UI components with consistent patterns
- **Utils**: Supabase client configuration, analytics, CORS helpers
- **UI Components**: Shadcn UI (shadcn@latest) with custom configuration. Use `npx shadcn@latest add <component-name>` to add new components.

### Key Implementation Details

#### Supabase Configuration
- Client configuration in `utils/supabase.ts` with persistent sessions
- Admin client in `utils/supabase-admin.ts` for server-side operations
- Row Level Security (RLS) enabled on all tables

#### Stripe Integration
- Webhook handling with comprehensive event processing
- Duplicate subscription prevention
- Session and subscription state management
- Support for subscription updates, cancellations, and reactivations

#### TypeScript Configuration
- Path aliases configured: `@/*` maps to project root
- Custom type definitions in `types/` directory
- Strict TypeScript settings enabled

### Development Patterns

#### Error Handling
- Error boundaries implemented but currently commented out
- Comprehensive webhook error logging
- Graceful auth state handling with loading states

#### State Management
- AuthContext provides centralized auth and subscription state
- Real-time subscription status updates via Supabase listeners
- Cleanup patterns for auth state on logout

#### Security
- Environment variable validation in Supabase client
- CORS utilities for API routes
- Webhook signature verification for Stripe events

## Implementation Status

### Completed Features (Phases I-III)

#### Phase I: Page Structure and Navigation ✅
- **Route Structure**: All 5 main pages implemented in `app/(app)/` route group
  - Dashboard (`/dashboard`) - Overview with KPIs and charts
  - Reviews (`/reviews`) - Core review management workflow
  - Digest (`/digest`) - Weekly analytics and insights
  - Settings (`/settings`) - Business profile and integrations
  - Help (`/help`) - FAQ and support
- **Authentication**: ProtectedRoute wrapper with AuthContext integration
- **Layout**: AppShell with TopBar (app name, theme toggle, user menu) and Sidebar navigation
- **Navigation**: Working routing between all pages with proper state management

#### Phase II: Dashboard Page ✅
- **KPI Cards**: Reviews this week, replies posted, average rating, pending approvals
- **Data Visualization**: Interactive reviews chart using Chart.js with mock data
- **Activity Feed**: Real-time activity tracking with user actions
- **Onboarding**: Multi-step onboarding card with Google API approval workflow
- **Data Integration**: Custom hooks (`useDashboardData`) for Supabase integration
- **State Management**: Real-time updates and loading states

#### Phase III: Reviews Page (Core Workflow) ✅
- **Filtering System**: Multi-criteria filtering (rating, status, date range, keyword search)
- **Reviews Table**: Complete table with rating, customer info, review text, AI replies, status
- **Inline Editing**: Direct editing of AI-generated replies in table cells
- **Bulk Operations**: Multi-select with bulk approve/post actions
- **Detail Drawer**: Slide-out panel for detailed review editing with tone selection
- **Status Management**: Complete workflow (pending → approved → posted)
- **Notifications**: Toast notifications for all user actions
- **Integration**: Updates dashboard metrics and activity feed

### Database Schema ✅
- **Complete Schema**: Deployed in `docs/flowrise-schema.sql`
- **Tables**: businesses, reviews, business_settings, activities, weekly_digests
- **Security**: Row Level Security (RLS) policies for all tables
- **Relationships**: Proper foreign key constraints and cascading deletes
- **Triggers**: Automated business_settings creation and updated_at timestamps

#### Phase IV: Digest Page ✅
- **Weekly Analytics**: Complete digest view with date range display
- **KPI Dashboard**: Total reviews, average rating, response rate, unique customers metrics
- **Trend Analysis**: Week-over-week change indicators with visual trending icons
- **Rating Visualization**: Interactive breakdown with animated progress bars
- **Theme Analysis**: Positive themes and improvement areas with color-coded badges
- **Review Highlights**: Best, worst, and notable reviews with customer details
- **Export Features**: Email sending, PDF generation, and CSV download functionality
- **UX Polish**: Responsive design, smooth animations, loading states, and error handling
- **Data Integration**: Mock data structure ready for Supabase integration

#### Phase V: Settings Page ✅
- **Tabbed Interface**: Clean 5-section navigation (Profile, Voice, Approval, Integrations, Billing)
- **Business Profile**: Complete form with name, location, industry, and Google Business ID
- **Brand Voice Config**: Voice presets and custom sliders for formality, warmth, and brevity
- **Approval Modes**: Manual, auto-approve 4+, and auto-approve except low ratings options
- **Integration Management**: Google Business Profile and Make.com webhook status and controls
- **Billing Overview**: Current plan display with upgrade and billing management options
- **Status Indicators**: Real-time connection status with color-coded icons
- **Form Handling**: Validation, save functionality, and loading states
- **Data Integration**: Mock data structure ready for Supabase integration

### Current Implementation Status
**✅ FULLY COMPLETED MVP FEATURES:**
- All 5 core pages implemented and functional
- Complete navigation system with protected routes
- Comprehensive database schema with RLS policies
- Mock data integration across all features
- Responsive UI with dark/light mode support
- Loading states, error handling, and user feedback
- Ready for production database integration

### Next Steps for Production
- Replace mock data with real Supabase database queries
- Implement Google Business API integration for review fetching
- Set up Make.com webhook endpoints for reply posting
- Add real-time data synchronization
- Deploy to production environment
- Implement comprehensive error monitoring and logging

### MCP Integration
This project supports Model Control Protocol (MCP) integration with:
- Stripe MCP server for payment management
- Supabase MCP server for database operations
- Configuration expected in `.cursor/mcp.json` (see README for setup)

### Development Notes
- Project uses "you-can-build-anything" as package name
- Supports both test and live Stripe configurations
- PostHog analytics integration available but currently disabled
- Dark mode support built into Tailwind configuration
