'use client';

import { showCookiePreferences } from '@/lib/cookieConsent';

export function CookieButton() {
  return (
    <button
      onClick={() => showCookiePreferences()}
      className="text-sm text-foreground/80 hover:text-foreground transition-colors text-left"
    >
      Manage Cookies
    </button>
  );
}
