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
- Requires Supabase, Stripe, OpenAI, Google OAuth, and Brevo email configuration for full functionality

## Architecture Overview

This is a Next.js 15 full-stack SaaS application for **RepliFast** - an AI-powered review management platform that helps small businesses manage Google reviews with intelligent, automated replies. The application features a complete MVP with modern landing page, comprehensive dashboard, and production-ready integrations.

### Tech Stack
- **Framework**: Next.js 15.4.6 (latest) with App Router
- **Language**: TypeScript 5.9.2 with strict mode enabled
- **Frontend**: React 19.0.0 with modern hooks and patterns
- **Styling**: Tailwind CSS 3.4.17 with PostCSS and autoprefixer
- **UI Components**: Radix UI primitives with custom shadcn/ui configuration
- **Animations**: Framer Motion 12.4.3 for smooth interactions
- **Icons**: Lucide React 0.539.0 for consistent iconography
- **Authentication**: Supabase Auth with Google OAuth integration
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Payments**: Stripe integration with subscription management
- **AI Services**: OpenAI API integration for reply generation
- **Email**: Brevo integration for transactional emails
- **Analytics**: Vercel Analytics and PostHog (configurable)
- **State Management**: React Context for auth and subscription state
- **Query Management**: TanStack React Query v5 for server state

### Core Architecture Patterns

#### Authentication Flow
- **AuthContext** (`contexts/AuthContext.tsx`) - Central authentication state management
  - Manages user sessions, subscription status, and auth operations
  - Includes subscription checking logic with TanStack Query integration
  - Handles soft-delete account reactivation
  - Supports multi-business selection with localStorage persistence
- **ProtectedRoute** (`contexts/ProtectedRoute.tsx`) - Route protection wrapper
- Authentication pages: login, reset-password, update-password, verify-email

#### Subscription Management
- Stripe webhook handlers in `app/api/stripe/` for subscription lifecycle events
- TanStack Query for centralized subscription state management (`hooks/queries/useSubscriptionQuery.ts`)
- Real-time subscription status checking in AuthContext
- Subscription status affects access control throughout the app

#### API Structure
- **AI API routes**: `/api/ai/` for OpenAI integration and reply generation
- **Google Business API routes**: `/api/auth/google-business/` for OAuth and credentials management
- **Review API routes**: `/api/reviews/` for sync and reply posting
- **Stripe API routes**: `/api/stripe/` for webhook handling, sync, test, cancel, reactivate
- **Email API routes**: `/api/emails/` for transactional email sending
- **User API routes**: `/api/user/delete` for account management
- **Config**: `config/api.ts` defines external API endpoints (separate backend at localhost:8080)

#### Database Schema
- **Database Schema**: Complete schema in `docs/flowrise-schema.sql`
- **Users table**: Soft-delete functionality (is_deleted, deleted_at fields)
- **Businesses table**: Multi-business support with Google Business Profile IDs and OAuth credentials
- **Reviews table**: Google reviews with AI-generated replies and status tracking
- **Business_settings table**: Voice configuration, approval modes, and integration settings
- **Activities table**: Audit trail for user actions and system events
- **Weekly_digests table**: Computed analytics and insights data
- **Subscriptions table**: Stripe integration for payment management
- **User preferences and trials tables**: Onboarding and trial management
- **Database triggers**: Automated user creation, updated_at timestamps, and business_settings initialization
- **Row Level Security**: Enabled on all tables with proper policies

#### Component Organization
- **App Router Structure**: Five main protected pages in `app/(app)/` route group:
  - `dashboard/` - Overview with KPIs and charts
  - `reviews/` - Core review management workflow
  - `insights/` - Weekly analytics and insights (formerly digest)
  - `settings/` - Business profile and integrations
  - `help/` - FAQ and support
- **Public Pages**: Landing page, login, auth flows, legal pages
- **Contexts**: AuthContext, ThemeContext, ProtectedRoute for app-wide state
- **Hooks**: Custom hooks with TanStack Query integration for data management
- **Services**: AI reply service, Google Business service, email services in `lib/services/`
- **Components**: Reusable UI components with consistent patterns
- **UI Components**: Radix UI primitives with custom shadcn/ui styling

### Key Implementation Details

#### Supabase Configuration
- Client configuration in `utils/supabase.ts` with persistent sessions
- Admin client in `utils/supabase-admin.ts` for server-side operations
- Row Level Security (RLS) enabled on all tables with proper policies
- Environment variable validation

#### AI Reply Generation
- **OpenAI Integration**: GPT-powered reply generation with business context
- **Brand Voice Configuration**: Customizable tone settings (formality, warmth, brevity)
- **Fallback Templates**: Template-based replies when AI service is unavailable
- **Reply Workflow**: Generate → Edit → Approve → Post pipeline with status tracking
- **Bulk Operations**: Multi-select reviews for batch processing

#### Google Business Profile Integration
- **OAuth 2.0 Flow**: Complete authentication with credential encryption using `CREDENTIALS_ENCRYPTION_KEY`
- **Multi-Business Support**: Users can connect multiple Google Business locations
- **Review Synchronization**: Automatic fetching and updating of reviews
- **Reply Posting**: Direct integration with Google Business Profile API
- **Credential Management**: Secure storage and refresh token handling

#### Stripe Integration
- Webhook handling with comprehensive event processing in `app/api/stripe/webhook/`
- Duplicate subscription prevention and management
- Session and subscription state management
- Support for subscription updates, cancellations, and reactivations
- TanStack Query integration for subscription state caching

#### Email System
- **Brevo Integration**: Transactional email sending via Brevo API
- **Email Templates**: Comprehensive template system in `lib/services/emailTemplates.ts`
- **Email Types**: Billing notifications, digest reports, reply confirmations, review notifications, system alerts
- **Testing**: Email testing endpoints in `app/api/emails/test/`

#### TypeScript Configuration
- Path aliases configured: `@/*` maps to project root
- Custom type definitions in `types/` directory
- Strict TypeScript settings enabled with latest TypeScript 5.9.2

### Development Patterns

#### Error Handling
- Error boundaries implemented with react-error-boundary
- Comprehensive webhook error logging
- Graceful auth state handling with loading states
- Google Business API error recovery

#### State Management
- AuthContext provides centralized auth and subscription state
- TanStack Query for server state management and caching
- Real-time subscription status updates via Supabase listeners
- Cleanup patterns for auth state on logout

#### Security
- Environment variable validation in Supabase client
- CORS utilities for API routes in `utils/cors.ts`
- Webhook signature verification for Stripe events
- Google OAuth credential encryption with `CREDENTIALS_ENCRYPTION_KEY`
- Row Level Security (RLS) policies on all database tables
- Secure API key management with `NEXT_PUBLIC_` prefix for client-side variables

### Production Deployment

#### Environment Variables
- **Client-side (NEXT_PUBLIC_)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Server-side only**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `CREDENTIALS_ENCRYPTION_KEY`, `BREVO_API_KEY`
- **Google OAuth**: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- Critical for Vercel deployment: maintain `NEXT_PUBLIC_` prefixes in environment variables

#### Build Configuration
- **PostCSS**: Configured with Tailwind CSS 3.4.17 and autoprefixer
- **TypeScript**: Strict mode with path aliases (`@/*` → project root)
- **Static Generation**: Optimized for Vercel deployment with proper prerendering

### MCP Integration
This project supports Model Control Protocol (MCP) integration with:
- Stripe MCP server for payment management
- Supabase MCP server for database operations
- Configuration in `.cursor/mcp.json` (see `.cursor/mcp.json.example` for setup)

### Current Implementation Status
**✅ FULLY COMPLETED MVP FEATURES:**
- Complete 5-page application with protected routes
- Full authentication system with Google OAuth
- Multi-business Google Business Profile integration
- AI-powered reply generation with OpenAI
- Comprehensive subscription management with Stripe
- Email system with Brevo integration
- Modern responsive UI with dark/light mode
- Complete database schema with RLS
- Production-ready deployment configuration

### Development Notes
- Project uses "replifast" as package name with RepliFast branding
- Supports both test and live Stripe configurations
- Email system uses Brevo instead of basic SMTP
- Dark mode support built into Tailwind configuration
- **Latest Updates**: Next.js 15.4.6, React 19, TypeScript 5.9.2, TanStack Query v5, comprehensive email system

### Core Workflow Patterns

#### Review Management Workflow
1. **Sync Reviews**: Google Business Profile API → Database via `/api/reviews/sync`
2. **AI Reply Generation**: OpenAI API with business context + brand voice settings
3. **Review & Edit**: User approves/modifies AI-generated replies in ReviewDrawer
4. **Bulk Operations**: Multi-select reviews for batch approval/posting
5. **Status Tracking**: pending → approved → posted workflow with activity logging

#### Brand Voice Configuration
- **Preset Options**: Friendly, Professional, Playful, Custom
- **Tone Controls**: Formality (1-10), Warmth (1-10), Brevity (1-10)
- **Custom Instructions**: Business-specific reply guidelines stored in business_settings
- **Fallback Templates**: Used when AI service unavailable

#### Email Workflow
- **Transactional Emails**: Automated sending via Brevo API
- **Template System**: Comprehensive email templates with dynamic content
- **Email Types**: Billing, digest reports, reply confirmations, review notifications
- **Testing**: Built-in email testing functionality

### Important Implementation Details

#### Multi-Business Support
- Users can connect multiple Google Business Profile locations
- Business selection persisted in localStorage
- Legacy single-business fields maintained for backward compatibility
- Business records created during Google OAuth connection flow

#### Authentication & OAuth
- Custom OAuth proxy support via `NEXT_PUBLIC_CUSTOM_AUTH_DOMAIN`
- Google Business Profile OAuth separate from basic Google auth
- Credential encryption for secure token storage
- Soft-delete user accounts with reactivation capability

#### Data Management
- TanStack Query for efficient server state caching
- Optimized dashboard data loading with single API calls
- Real-time subscription status updates
- Comprehensive error recovery and retry logic