# Authentication System Documentation

## Overview
This document outlines the authentication flow and user management in the application, including recent changes to remove the trial system.

## User Types
1. **Unauthenticated Users**
   - Can access public pages
   - Can sign up or log in

2. **Basic Users (Authenticated, No Subscription)**
   - Have completed email verification
   - Limited access to features
   - Can upgrade to Premium

3. **Premium Users (Authenticated with Active Subscription)**
   - Full access to all features
   - Active subscription required

## Authentication Flow

### Sign Up Process
1. User submits registration form with email and password
2. Supabase Auth creates user account
3. Verification email sent to user's email
4. After email verification, user is redirected to dashboard
5. On first login, business info is initialized if not exists

### Login Process
1. User submits login form with email and password
2. Supabase Auth verifies credentials
3. On success:
   - User session is established
   - Subscription status is checked
   - Business info is loaded
   - User is redirected to dashboard

## Key Components

### AuthContext
- Manages authentication state and user session
- Handles subscription status
- Manages business information
- Provides auth methods to components

### useSubscription Hook
- Checks for active subscriptions
- Manages subscription state
- Handles subscription-related errors

## Recent Changes

### Removed Trial System
- Trial-related code and checks have been removed
- Users are now either Basic or Premium
- Subscription status is binary (active or not active)

### Error Handling Improvements
- Better handling of missing business records
- Graceful degradation for new users
- Suppressed unnecessary error logs for expected cases

## Database Tables

### users (Supabase Auth)
- Handles authentication
- Stores email, password hashes, etc.

### subscriptions
- Tracks user subscription status
- Only active subscriptions are considered valid

### businesses
- Stores business information
- Linked to user accounts
- Uses maybeSingle() for graceful handling of missing records

## API Endpoints
- `/api/auth/*`: Authentication endpoints (handled by NextAuth/Supabase)
- `/api/subscription/*`: Subscription management
- `/api/business/*`: Business information management
