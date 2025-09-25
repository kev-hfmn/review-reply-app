'use client';

import { useState } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  const scrollToPromoCode = () => {
    const promoElement = document.getElementById('promocode');
    if (promoElement) {
      promoElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className=" relative top-0 left-0 right-0 bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-white z-[9999] pointer-events-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left spacer for centering */}
          <div className="w-6 sm:w-8"></div>

          {/* Main content */}
          <div
            className="relative z-20 flex items-center justify-center gap-2 text-center cursor-pointer sm:cursor-default"
            onClick={scrollToPromoCode}
          >
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            <span className="text-sm sm:text-base font-medium">
              <span className="hidden sm:inline">🎉 Early Bird Special: </span>
              <span className="font-bold">33% OFF</span> for the first 100 customers
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                scrollToPromoCode();
              }}
              className="hidden sm:inline-flex items-center gap-1 ml-2 text-sm font-semibold hover:text-yellow-200 transition-colors group cursor-pointer"
            >
              Claim now
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Subtle animation background (non-interactive) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-50 z-10"></div>
    </div>
  );
}
