// Google Business Profile error handling and user guidance
// Phase 6.2: Error Handling & User Guidance

export enum GoogleBusinessErrorType {
  // Connection errors
  BUSINESS_NOT_VERIFIED = 'BUSINESS_NOT_VERIFIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  MULTIPLE_LOCATIONS = 'MULTIPLE_LOCATIONS',
  CONNECTION_EXPIRED = 'CONNECTION_EXPIRED',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  
  // Authentication errors
  OAUTH_DENIED = 'OAUTH_DENIED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  
  // Business profile errors
  NO_BUSINESS_PROFILE = 'NO_BUSINESS_PROFILE',
  PROFILE_ACCESS_DENIED = 'PROFILE_ACCESS_DENIED',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  
  // API errors
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GoogleBusinessError {
  type: GoogleBusinessErrorType;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  isRetryable: boolean;
  guidance: string[];
}

export const GOOGLE_BUSINESS_ERRORS: Record<GoogleBusinessErrorType, GoogleBusinessError> = {
  [GoogleBusinessErrorType.BUSINESS_NOT_VERIFIED]: {
    type: GoogleBusinessErrorType.BUSINESS_NOT_VERIFIED,
    title: 'Business Not Verified',
    message: 'Your Google Business Profile needs to be verified before you can manage reviews.',
    actionText: 'Verify Business',
    actionUrl: 'https://business.google.com/',
    isRetryable: false,
    guidance: [
      'Log into your Google Business Profile account',
      'Complete the verification process (typically takes 1-2 weeks)',
      'Return here once verification is complete',
      'Contact support if you need help with verification'
    ]
  },
  
  [GoogleBusinessErrorType.INSUFFICIENT_PERMISSIONS]: {
    type: GoogleBusinessErrorType.INSUFFICIENT_PERMISSIONS,
    title: 'Insufficient Permissions',
    message: 'You need owner or manager access to this Google Business Profile to manage reviews.',
    actionText: 'Check Permissions',
    actionUrl: 'https://business.google.com/',
    isRetryable: false,
    guidance: [
      'Ensure you have owner or manager access to the business profile',
      'If you\'re not the owner, ask them to grant you manager access',
      'Try connecting again once permissions are updated',
      'Contact the business owner if you need access'
    ]
  },
  
  [GoogleBusinessErrorType.MULTIPLE_LOCATIONS]: {
    type: GoogleBusinessErrorType.MULTIPLE_LOCATIONS,
    title: 'Multiple Locations Found',
    message: 'We found multiple business locations. Please select which one you\'d like to manage.',
    actionText: 'Select Location',
    isRetryable: true,
    guidance: [
      'Choose the primary location you want to manage',
      'You can add additional locations later in settings',
      'Each location requires separate connection',
      'Pro Plus subscription supports multi-location management'
    ]
  },
  
  [GoogleBusinessErrorType.CONNECTION_EXPIRED]: {
    type: GoogleBusinessErrorType.CONNECTION_EXPIRED,
    title: 'Connection Expired',
    message: 'Your Google Business Profile connection has expired and needs to be renewed.',
    actionText: 'Reconnect',
    isRetryable: true,
    guidance: [
      'Click "Reconnect" to refresh your connection',
      'You may need to re-authorize access',
      'Your review data and settings will be preserved',
      'This happens periodically for security reasons'
    ]
  },
  
  [GoogleBusinessErrorType.API_RATE_LIMIT]: {
    type: GoogleBusinessErrorType.API_RATE_LIMIT,
    title: 'Rate Limit Exceeded',
    message: 'Too many requests to Google\'s API. Please wait a few minutes before trying again.',
    actionText: 'Retry Later',
    isRetryable: true,
    guidance: [
      'Wait 5-10 minutes before trying again',
      'This is a temporary limitation from Google',
      'Your connection is still active',
      'Contact support if this persists'
    ]
  },
  
  [GoogleBusinessErrorType.OAUTH_DENIED]: {
    type: GoogleBusinessErrorType.OAUTH_DENIED,
    title: 'Access Denied',
    message: 'You declined to grant access to your Google Business Profile.',
    actionText: 'Try Again',
    isRetryable: true,
    guidance: [
      'Click "Try Again" to restart the connection process',
      'Make sure to click "Allow" when prompted by Google',
      'We only request access to manage your business profile',
      'Your data remains secure and private'
    ]
  },
  
  [GoogleBusinessErrorType.INVALID_CREDENTIALS]: {
    type: GoogleBusinessErrorType.INVALID_CREDENTIALS,
    title: 'Invalid Credentials',
    message: 'There was an issue with your Google account credentials.',
    actionText: 'Reconnect',
    isRetryable: true,
    guidance: [
      'Try disconnecting and reconnecting your account',
      'Make sure you\'re using the correct Google account',
      'Clear your browser cache if the issue persists',
      'Contact support if you continue having problems'
    ]
  },
  
  [GoogleBusinessErrorType.TOKEN_REFRESH_FAILED]: {
    type: GoogleBusinessErrorType.TOKEN_REFRESH_FAILED,
    title: 'Connection Refresh Failed',
    message: 'Unable to refresh your Google Business Profile connection.',
    actionText: 'Reconnect',
    isRetryable: true,
    guidance: [
      'Try reconnecting your Google Business Profile',
      'This may happen if you changed your Google password',
      'Your review data is safe and will be restored',
      'Contact support if reconnection fails'
    ]
  },
  
  [GoogleBusinessErrorType.NO_BUSINESS_PROFILE]: {
    type: GoogleBusinessErrorType.NO_BUSINESS_PROFILE,
    title: 'No Business Profile Found',
    message: 'We couldn\'t find a Google Business Profile associated with your account.',
    actionText: 'Create Profile',
    actionUrl: 'https://business.google.com/',
    isRetryable: false,
    guidance: [
      'Create a Google Business Profile for your business',
      'Make sure your business is listed on Google',
      'Complete the verification process',
      'Return here once your profile is set up'
    ]
  },
  
  [GoogleBusinessErrorType.PROFILE_ACCESS_DENIED]: {
    type: GoogleBusinessErrorType.PROFILE_ACCESS_DENIED,
    title: 'Profile Access Denied',
    message: 'We don\'t have permission to access this Google Business Profile.',
    actionText: 'Grant Access',
    isRetryable: true,
    guidance: [
      'Try the connection process again',
      'Make sure to grant all requested permissions',
      'Check that you\'re using the correct Google account',
      'Contact the profile owner if you\'re not the owner'
    ]
  },
  
  [GoogleBusinessErrorType.LOCATION_NOT_FOUND]: {
    type: GoogleBusinessErrorType.LOCATION_NOT_FOUND,
    title: 'Location Not Found',
    message: 'The selected business location could not be found or accessed.',
    actionText: 'Select Different Location',
    isRetryable: true,
    guidance: [
      'Try selecting a different location',
      'Make sure the location still exists in your Google Business Profile',
      'Check that you have access to the location',
      'Contact support if the location should be available'
    ]
  },
  
  [GoogleBusinessErrorType.API_UNAVAILABLE]: {
    type: GoogleBusinessErrorType.API_UNAVAILABLE,
    title: 'Service Temporarily Unavailable',
    message: 'Google\'s Business Profile API is temporarily unavailable.',
    actionText: 'Try Again Later',
    isRetryable: true,
    guidance: [
      'This is a temporary issue with Google\'s services',
      'Try again in 10-15 minutes',
      'Your connection and data are safe',
      'We\'ll notify you when service is restored'
    ]
  },
  
  [GoogleBusinessErrorType.NETWORK_ERROR]: {
    type: GoogleBusinessErrorType.NETWORK_ERROR,
    title: 'Network Connection Error',
    message: 'Unable to connect to Google\'s services. Please check your internet connection.',
    actionText: 'Retry',
    isRetryable: true,
    guidance: [
      'Check your internet connection',
      'Try refreshing the page',
      'Make sure you\'re not behind a restrictive firewall',
      'Contact support if the issue persists'
    ]
  },
  
  [GoogleBusinessErrorType.UNKNOWN_ERROR]: {
    type: GoogleBusinessErrorType.UNKNOWN_ERROR,
    title: 'Unexpected Error',
    message: 'An unexpected error occurred while connecting to Google Business Profile.',
    actionText: 'Contact Support',
    isRetryable: true,
    guidance: [
      'Try the connection process again',
      'Check that your Google Business Profile is accessible',
      'Clear your browser cache and cookies',
      'Contact our support team with the error details'
    ]
  }
};

/**
 * Get error details for a specific error type
 */
export function getGoogleBusinessError(errorType: GoogleBusinessErrorType): GoogleBusinessError {
  return GOOGLE_BUSINESS_ERRORS[errorType];
}

/**
 * Parse an error response and return the appropriate error type
 */
export function parseGoogleBusinessError(error: unknown): GoogleBusinessErrorType {
  if (!error) return GoogleBusinessErrorType.UNKNOWN_ERROR;
  
  const message = typeof error === 'string' ? error : (error as any)?.message || '';
  const status = (error as any)?.status || (error as any)?.statusCode || 0;
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return GoogleBusinessErrorType.NETWORK_ERROR;
  }
  
  // Authentication errors
  if (status === 401 || message.includes('unauthorized') || message.includes('invalid_grant')) {
    return GoogleBusinessErrorType.INVALID_CREDENTIALS;
  }
  
  if (message.includes('access_denied') || message.includes('denied')) {
    return GoogleBusinessErrorType.OAUTH_DENIED;
  }
  
  // Permission errors
  if (status === 403 || message.includes('forbidden') || message.includes('insufficient')) {
    return GoogleBusinessErrorType.INSUFFICIENT_PERMISSIONS;
  }
  
  // Rate limiting
  if (status === 429 || message.includes('rate limit') || message.includes('quota')) {
    return GoogleBusinessErrorType.API_RATE_LIMIT;
  }
  
  // Business profile specific errors
  if (message.includes('not verified') || message.includes('verification')) {
    return GoogleBusinessErrorType.BUSINESS_NOT_VERIFIED;
  }
  
  if (message.includes('multiple locations') || message.includes('multiple businesses')) {
    return GoogleBusinessErrorType.MULTIPLE_LOCATIONS;
  }
  
  if (message.includes('no business profile') || message.includes('profile not found')) {
    return GoogleBusinessErrorType.NO_BUSINESS_PROFILE;
  }
  
  if (message.includes('location not found') || message.includes('invalid location')) {
    return GoogleBusinessErrorType.LOCATION_NOT_FOUND;
  }
  
  // Token errors
  if (message.includes('token') && (message.includes('expired') || message.includes('invalid'))) {
    return GoogleBusinessErrorType.CONNECTION_EXPIRED;
  }
  
  if (message.includes('refresh') && message.includes('failed')) {
    return GoogleBusinessErrorType.TOKEN_REFRESH_FAILED;
  }
  
  // Service errors
  if (status >= 500 || message.includes('internal server error') || message.includes('service unavailable')) {
    return GoogleBusinessErrorType.API_UNAVAILABLE;
  }
  
  return GoogleBusinessErrorType.UNKNOWN_ERROR;
}

/**
 * Create a user-friendly error message with guidance
 */
export function createErrorMessage(error: unknown): {
  error: GoogleBusinessError;
  technicalDetails?: string;
} {
  const errorType = parseGoogleBusinessError(error);
  const errorDetails = getGoogleBusinessError(errorType);
  
  return {
    error: errorDetails,
    technicalDetails: typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error)
  };
}
