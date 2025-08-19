# Authentication System Documentation

## Overview
This document outlines the authentication flow, user management, and onboarding system in the RepliFast application. All issues have been resolved and the system is fully operational.

## System Status: ✅ FULLY IMPLEMENTED
All authentication improvements, business record creation fixes, trial system removal, and onboarding features have been successfully implemented and are working in production.

## User Types
1. **Unauthenticated Users**
   - Can access public pages
   - Can sign up or log in

2. **Basic Users (Authenticated, No Subscription)**
   - Have completed email verification
   - Can configure basic business profile settings
   - Can upgrade to Premium for advanced features

3. **Premium Users (Authenticated with Active Subscription)**
   - Full access to all features including integrations
   - Active subscription required for advanced automation

## Authentication Flow

### Sign Up Process (Email)
1. User submits registration form with email, password, AND business name
2. Supabase Auth creates user account
3. Business record created immediately with provided business name
4. Verification email sent to user's email
5. After email verification, user is redirected to dashboard
6. User sees 4-step onboarding guide and can immediately access settings

### Sign Up Process (Google OAuth)
1. User clicks "Sign in with Google"
2. Google OAuth flow creates user account
3. Business record created automatically with default name "My Business"
4. User is redirected to dashboard with 4-step onboarding guide
5. User can update business name in settings and complete onboarding steps

### Login Process
1. User submits login form with email and password
2. Supabase Auth verifies credentials
3. On success:
   - User session is established
   - Subscription status is checked
   - Business info is loaded (guaranteed to exist)
   - User is redirected to dashboard
   - Onboarding guide shows if Google integration incomplete

## 4-Step Onboarding System

For Basic users without complete Google Business Profile integration, a comprehensive onboarding guide is displayed on the dashboard:

### Step 1: Apply for Google Business API Access
- **Title**: "Apply for Google Business API access (free)"
- **Description**: Schedule a video call for guided Google Business Profile API application
- **Duration**: 10-minute application process, up to 2 weeks for Google approval
- **Action**: Opens Calendly link (`https://calendly.com/replifast/30min`)
- **Completion**: Marked complete when user has Google access & refresh tokens

### Step 2: Enter Google Details
- **Title**: "Enter Google details"
- **Description**: Add Google Business Profile credentials after API approval
- **Action**: Navigates to Settings > Integrations tab
- **Completion**: Marked complete when Google credentials are entered

### Step 3: Pick Your Brand Voice
- **Title**: "Pick your brand voice"
- **Description**: Customize AI reply tone and personality
- **Action**: Navigates to Settings > Voice tab
- **Completion**: Marked complete when brand voice is configured

### Step 4: Start Auto-Replies
- **Title**: "Start auto-replies"
- **Description**: Enable automatic reply generation and posting
- **Action**: Navigates to Settings > Approval tab
- **Completion**: Marked complete when non-manual approval mode is enabled

### Onboarding Display Logic
- **Shows for**: Basic users (no active subscription) without complete Google integration
- **Hides for**: Premium users OR users with Google Business Profile fully connected
- **Visual**: Progress tracking with completion indicators and contextual messaging

## Key Components

### AuthContext
- Manages authentication state and user session
- Handles subscription status
- Manages business information (guaranteed to exist)
- Provides auth methods to components

### useSubscription Hook
- Checks for active subscriptions
- Manages subscription state
- Handles subscription-related errors

## Database Tables

### users (Supabase Auth)
- Handles authentication
- Stores email, password hashes, etc.

### subscriptions
- Tracks user subscription status
- Only active subscriptions are considered valid

### businesses
- Stores business information
- Linked to user accounts (1:1 relationship guaranteed)
- Every authenticated user has exactly one business record

### business_settings
- Automatically created via trigger when business is created
- Stores brand voice, approval modes, integration settings

## Feature Access Control

### Basic Users Can Access:
- ✅ Business profile editing (name, location, industry)
- ✅ Brand voice configuration (tone, formality, warmth, brevity)
- ✅ Approval mode settings (manual, auto-4+, auto-except-low)
- ✅ Google Business Profile integration setup (credentials & connection)
- ✅ 4-step onboarding guide with Calendly integration
- ✅ View all settings tabs and configure basic functionality

### Premium Users Additional Access:
- 🚀 Advanced automated review sync scheduling
- 🚀 Full AI reply automation pipeline
- 🚀 Advanced webhook integrations (Make.com)
- 🚀 Priority support and advanced features
- 🚀 Enhanced analytics and reporting

**Note**: Google Business Profile integration is available to all users, but requires manual API approval process through consultation calls.

## API Endpoints
- `/api/auth/*`: Authentication endpoints (handled by Supabase)
- `/api/subscription/*`: Subscription management
- `/api/business/*`: Business information management

## Implementation Results ✅

### Completed Features
- ✅ **Trial system completely removed** - No remnants in codebase
- ✅ **Business records auto-created** - Every user gets a business record on signup
- ✅ **Enhanced signup flow** - Collects business name during email registration
- ✅ **Google OAuth support** - Automatic business creation with fallback names
- ✅ **Settings page accessibility** - All users can edit basic profile settings
- ✅ **4-step onboarding system** - Guides Basic users through Google API setup
- ✅ **Smart display logic** - Onboarding shows only when needed
- ✅ **Subscription-aware UX** - Different experiences for Basic vs Premium users
- ✅ **Existing user backfill** - All existing users now have business records
- ✅ **Calendly integration** - Direct scheduling for API approval consultations

### Database Integrity
- ✅ All users have business records (1:1 relationship guaranteed)
- ✅ Business settings automatically created via triggers
- ✅ No orphaned records or constraint violations
- ✅ User trials table removed cleanly

### User Experience Improvements
- ✅ Seamless signup process with business name collection
- ✅ Immediate settings access for all authenticated users
- ✅ Clear onboarding path for Google Business Profile integration
- ✅ Progressive disclosure of premium features
- ✅ Professional consultation workflow for API approval

## Manual Google API Approval Workflow

Due to Google Business Profile API requirements, new users follow a guided approval process:

1. **Initial Signup**: Users create accounts and see onboarding guide
2. **Consultation Booking**: Users schedule free 30-minute calls via Calendly
3. **Guided Application**: Personal assistance with Google API application process
4. **Approval Period**: Up to 2 weeks for Google to review and approve access
5. **Credentials Setup**: Users enter approved credentials in settings
6. **Full Activation**: Complete access to AI-powered review management

This workflow ensures high success rates for API approval while providing personalized support for users navigating Google's requirements.
