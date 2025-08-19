// Google Analytics with Consent Mode configuration

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics with consent mode
export const initGoogleAnalytics = (measurementId: string) => {
  // Only run on client side
  if (typeof window === 'undefined') return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  
  window.gtag = gtag;

  // Set default consent to 'denied' as a placeholder
  // Real consent will be managed by cookie consent library
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted', // Always granted for security
  });

  // Configure Google Analytics
  gtag('js', new Date());
  gtag('config', measurementId, {
    // Anonymize IP addresses
    anonymize_ip: true,
    // Respect user's DNT header
    respect_dnt: true,
    // Additional privacy settings
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  // Load GA script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
};

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Update consent
export const updateGoogleConsent = (consentUpdate: Record<string, 'granted' | 'denied'>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', consentUpdate);
  }
};