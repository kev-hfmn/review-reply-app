'use client';

import { useEffect } from 'react';
import '@/styles/cookieconsent.css';
import { initCookieConsent } from '@/lib/cookieConsent';

export const CookieConsent = () => {
  useEffect(() => {
    // Initialize cookie consent only on client-side
    initCookieConsent();
  }, []);

  // This component doesn't render anything visible
  // The cookie consent modal is injected into the DOM by the library
  return null;
};

export default CookieConsent;