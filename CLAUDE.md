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

This is a Next.js 15 full-stack SaaS application for **RepliFast** - an AI-powered review management platform that helps small businesses manage Google reviews with intelligent, automated replies. The application features a complete MVP with modern landing page, comprehensive dashboard, and production-ready integrations.

### Tech Stack
- **Framework**: Next.js 15.4.6 (latest) with App Router
- **Language**: TypeScript 5.9.2 with strict mode enabled
- **Frontend**: React 19.0.0 with modern hooks and patterns
- **Styling**: Tailwind CSS 3.4.17 with PostCSS and autoprefixer
- **UI Components**: Shadcn UI (shadcn@latest) with custom configuration
- **Animations**: Framer Motion 12.4.3 for smooth interactions
- **Icons**: Lucide React 0.539.0 for consistent iconography
- **Authentication**: Supabase Auth with Google OAuth integration
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Payments**: Stripe integration with subscription management
- **AI Services**: OpenAI API integration for reply generation
- **Analytics**: Vercel Analytics (PostHog available but disabled)
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
- **AI API routes**: `/api/ai/` for OpenAI integration and reply generation
- **Google Business API routes**: `/api/auth/google-business/` for OAuth and credentials management
- **Review API routes**: `/api/reviews/` for sync and reply posting
- **Stripe API routes**: `/api/stripe/` for webhook handling, sync, test, cancel, reactivate
- **User API routes**: `/api/user/delete` for account management
- **Config**: `config/api.ts` defines external API endpoints (separate backend at localhost:8080)

#### Database Schema
- **Users table**: Soft-delete functionality (is_deleted, deleted_at fields)
- **Businesses table**: Business profile information and Google Business Profile IDs
- **Reviews table**: Google reviews with AI-generated replies and status tracking
- **Business_settings table**: Voice configuration, approval modes, and integration settings
- **Activities table**: Audit trail for user actions and system events
- **Weekly_digests table**: Computed analytics and insights data
- **Subscriptions table**: Stripe integration for payment management
- **User preferences and trials tables**: Onboarding and trial management
- **Database triggers**: Automated user creation, updated_at timestamps, and business_settings initialization

#### Component Organization
- **Contexts**: AuthContext, ThemeProvider, ProtectedRoute for app-wide state
- **Hooks**: useSubscription, useTrialStatus, useDashboardData, useReviewsData for data management
- **Services**: AI reply service (`lib/services/aiReplyService.ts`), Google Business service, digest insights service
- **Components**: Reusable UI components with consistent patterns (TypewriterEffect, VideoModal, ReviewsTable, etc.)
- **Utils**: Supabase client configuration, analytics, CORS helpers
- **UI Components**: Shadcn UI (shadcn@latest) with custom configuration. Use `npx shadcn@latest add <component-name>` to add new components.

### Key Implementation Details

#### Supabase Configuration
- Client configuration in `utils/supabase.ts` with persistent sessions
- Admin client in `utils/supabase-admin.ts` for server-side operations
- Row Level Security (RLS) enabled on all tables

#### AI Reply Generation
- **OpenAI Integration**: GPT-powered reply generation with business context
- **Brand Voice Configuration**: Customizable tone settings (formality, warmth, brevity)
- **Fallback Templates**: Template-based replies when AI service is unavailable
- **Reply Workflow**: Generate → Edit → Approve → Post pipeline with status tracking

#### Google Business Profile Integration
- **OAuth 2.0 Flow**: Complete authentication with credential encryption
- **Review Synchronization**: Automatic fetching and updating of reviews
- **Reply Posting**: Direct integration with Google Business Profile API
- **Credential Management**: Secure storage and refresh token handling

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
- Google OAuth credential encryption with `CREDENTIALS_ENCRYPTION_KEY`
- Row Level Security (RLS) policies on all database tables
- Secure API key management with `NEXT_PUBLIC_` prefix for client-side variables

### Development & Deployment Patterns

#### Environment Variables
- **Client-side (NEXT_PUBLIC_)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Server-side only**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `CREDENTIALS_ENCRYPTION_KEY`
- Critical for Vercel deployment: maintain `NEXT_PUBLIC_` prefixes in environment variables

#### Build Configuration
- **PostCSS**: Configured with Tailwind CSS 3.4.17 and autoprefixer
- **TypeScript**: Strict mode with path aliases (`@/*` → project root)
- **Static Generation**: Optimized for Vercel deployment with proper prerendering

#### Landing Page Architecture
- **Modern Design**: Complete redesign with hero section, features showcase, testimonials
- **SEO Optimized**: Meta tags, structured data, and semantic HTML
- **Interactive Elements**: Framer Motion animations, scroll-triggered effects, video modal
- **Navigation**: Smooth scroll navigation with active section tracking

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
- Project uses "replifast" as package name
- **Current Branding**: RepliFast (as seen in landing page and components)
- Supports both test and live Stripe configurations
- PostHog analytics integration available but currently disabled in favor of Vercel Analytics
- Dark mode support built into Tailwind configuration with ThemeProvider
- **Latest Updates**: Next.js 15.4.6, React 19, TypeScript 5.9.2, modern landing page design, rebranded to RepliFast

### Core Workflow Patterns

#### Review Management Workflow
1. **Sync Reviews**: Google Business Profile API → Database
2. **AI Reply Generation**: OpenAI API with business context + brand voice settings
3. **Review & Edit**: User approves/modifies AI-generated replies in ReviewDrawer
4. **Bulk Operations**: Multi-select reviews for batch approval/posting
5. **Status Tracking**: pending → approved → posted workflow with activity logging

#### Brand Voice Configuration
- **Preset Options**: Friendly, Professional, Playful, Custom
- **Tone Controls**: Formality (1-10), Warmth (1-10), Brevity (1-10)
- **Custom Instructions**: Business-specific reply guidelines
- **Fallback Templates**: Used when AI service unavailable

#### Data Flow Architecture
- **Frontend**: React components with real-time state management
- **API Layer**: Next.js API routes for external service integration
- **Database**: Supabase with RLS policies and audit trails
- **External Services**: Google Business API, OpenAI API, Stripe webhooks

### Production Deployment Checklist
- ✅ Environment variables configured with proper `NEXT_PUBLIC_` prefixes
- ✅ Supabase RLS policies enabled and tested
- ✅ Stripe webhook endpoints configured
- ✅ Google Business Profile API credentials set up
- ✅ OpenAI API key configured for AI reply generation
- ✅ Build optimizations enabled (static generation, image optimization)
- ✅ SEO meta tags and structured data implemented
