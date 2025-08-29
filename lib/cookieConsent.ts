import * as CookieConsent from 'vanilla-cookieconsent';
import { updateGoogleConsent } from './gtag';

// Minimal runtime API we use that may not exist on the package types
type CookieConsentAPI = {
  showPreferences?: () => void;
  show?: (createModal?: boolean) => void;
};

// Cookie consent configuration for RepliFast
export const cookieConsentConfig = {
  // Auto-show the consent modal if consent is not valid
  autoShow: true,

  // GDPR compliant mode - scripts only run after user consent
  mode: 'opt-in' as const,

  // Hide from bots to prevent indexing modal content
  hideFromBots: true,

  // Manage script tags with data-category attribute
  manageScriptTags: true,

  // Auto clear cookies when categories are rejected
  autoClearCookies: true,

  // Cookie settings
  cookie: {
    name: 'replifast_cookie_consent',
    domain: typeof window !== 'undefined' ? window.location.hostname : '',
    path: '/',
    secure: true,
    expiresAfterDays: 365,
    sameSite: 'Lax' as const,
  },

  // GUI styling options to match RepliFast design
  guiOptions: {
    consentModal: {
      layout: 'box inline' as const,
      position: 'bottom right' as const,
      equalWeightButtons: true,
      flipButtons: false
    },
    preferencesModal: {
      layout: 'box' as const,
      position: 'right' as const,
      equalWeightButtons: true,
      flipButtons: false
    }
  },

  // Cookie categories configuration
  categories: {
    necessary: {
      enabled: true,
      readOnly: true, // Cannot be disabled - required for core functionality
    },
    analytics: {
      enabled: false, // User must opt-in
      autoClear: {
        cookies: [
          { name: /^_ga/ }, // Google Analytics cookies
          { name: '_gid' },
          { name: /^_gat/ },
          { name: '_gtag' }
        ],
        reloadPage: false
      },
      services: {
        'google-analytics': {
          label: 'Google Analytics',
          onAccept: () => {
            // Enable Google Analytics consent
            updateGoogleConsent({
              'analytics_storage': 'granted'
            });
          },
          onReject: () => {
            // Disable Google Analytics consent
            updateGoogleConsent({
              'analytics_storage': 'denied'
            });
          }
        }
      }
    },
    functional: {
      enabled: false, // User must opt-in
      autoClear: {
        cookies: [
          { name: 'theme-preference' },
          { name: 'language-preference' }
        ],
        reloadPage: false
      }
    }
  },

  // Language and translations
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'We value your privacy',
          description: 'RepliFast uses cookies to provide essential functionality and improve your experience. You can customize your preferences or accept all cookies to continue.',
          acceptAllBtn: 'Accept all cookies',
          acceptNecessaryBtn: 'Accept necessary only',
          showPreferencesBtn: 'Customize settings',
          footer: `
            <a href="/privacy" class="cc-link">Privacy Policy</a>
            <a href="/cookies" class="cc-link">Cookie Policy</a>
            <a href="/terms" class="cc-link">Terms of Service</a>
          `
        },
        preferencesModal: {
          title: 'Cookie Preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Accept necessary only',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          serviceCounterLabel: 'Service|Services',
          sections: [
            {
              title: 'Cookie Usage',
              description: 'We use cookies to ensure basic functionality and enhance your experience on RepliFast. You can choose which categories of cookies to accept.'
            },
            {
              title: 'Strictly Necessary Cookies',
              description: 'These cookies are essential for RepliFast to function properly. They enable core features like authentication, security, and basic navigation. These cookies cannot be disabled.',
              linkedCategory: 'necessary'
            },
            {
              title: 'Analytics Cookies',
              description: 'These cookies help us understand how you use RepliFast by collecting anonymous usage data. This helps us improve our service and fix issues.',
              linkedCategory: 'analytics',
              cookieTable: {
                caption: 'Analytics Cookies',
                headers: {
                  name: 'Cookie',
                  domain: 'Purpose',
                  desc: 'Description',
                  duration: 'Duration'
                },
                body: [
                  {
                    name: '_ga',
                    domain: 'Google Analytics',
                    desc: 'Distinguishes unique users and sessions',
                    duration: '2 years'
                  },
                  {
                    name: '_gid',
                    domain: 'Google Analytics',
                    desc: 'Distinguishes unique users',
                    duration: '24 hours'
                  },
                  {
                    name: '_gat',
                    domain: 'Google Analytics',
                    desc: 'Throttles request rate',
                    duration: '1 minute'
                  }
                ]
              }
            },
            {
              title: 'Functional Cookies',
              description: 'These cookies enhance your experience by remembering your preferences like theme settings and language choices.',
              linkedCategory: 'functional'
            },
            {
              title: 'More Information',
              description: 'For questions about our cookie usage, please read our <a href="/cookies" class="cc-link">Cookie Policy</a> or <a href="/privacy" class="cc-link">Privacy Policy</a>. You can change your preferences at any time.'
            }
          ]
        }
      }
    }
  },

  // Event callbacks
  onFirstConsent: ({ cookie }: { cookie: { categories?: string[] } }) => {
    console.log('First consent given:', cookie);
    // Update Google Analytics consent based on user choice
    updateGoogleConsent({
      'analytics_storage': cookie.categories?.includes('analytics') ? 'granted' : 'denied',
      'functionality_storage': cookie.categories?.includes('functional') ? 'granted' : 'denied',
    });
  },

  onConsent: ({ cookie }: { cookie: { categories?: string[] } }) => {
    console.log('Consent updated:', cookie);
    // Update Google Analytics consent on every page load
    updateGoogleConsent({
      'analytics_storage': cookie.categories?.includes('analytics') ? 'granted' : 'denied',
      'functionality_storage': cookie.categories?.includes('functional') ? 'granted' : 'denied',
    });
  },

  onChange: ({ changedCategories, changedServices }: { changedCategories: string[]; changedServices: Record<string, string[]> }) => {
    console.log('Consent changed:', { changedCategories, changedServices });
    // Update Google Analytics consent when user changes preferences
    const isAnalyticsAccepted = CookieConsent.acceptedCategory('analytics');
    const isFunctionalAccepted = CookieConsent.acceptedCategory('functional');

    updateGoogleConsent({
      'analytics_storage': isAnalyticsAccepted ? 'granted' : 'denied',
      'functionality_storage': isFunctionalAccepted ? 'granted' : 'denied',
    });
  }
};

// Initialize cookie consent
export const initCookieConsent = () => {
  if (typeof window !== 'undefined') {
    CookieConsent.run(cookieConsentConfig);
  }
};

// Show preferences modal
export const showCookiePreferences = () => {
  if (typeof window === 'undefined') return;
  const cc = CookieConsent as unknown as CookieConsentAPI;
  // Preferred API per v3: showPreferences
  if (typeof cc.showPreferences === 'function') {
    cc.showPreferences();
    return;
  }
  // Fallback: show consent modal (create if needed)
  if (typeof cc.show === 'function') {
    cc.show(true);
  }
};

// Check if a category is accepted
export const isCategoryAccepted = (category: string) => {
  if (typeof window === 'undefined') return false;
  return CookieConsent.acceptedCategory(category);
};

// Check if a service is accepted
export const isServiceAccepted = (service: string, category: string) => {
  if (typeof window === 'undefined') return false;
  return CookieConsent.acceptedService(service, category);
};

export default CookieConsent;
