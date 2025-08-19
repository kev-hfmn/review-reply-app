'use client';

import { useEffect } from 'react';
import { initGoogleAnalytics } from '@/lib/gtag';

export const GoogleAnalytics = () => {
  useEffect(() => {
    // Only initialize if we have a measurement ID
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (measurementId) {
      initGoogleAnalytics(measurementId);
    }
  }, []);

  return null;
};

export default GoogleAnalytics;