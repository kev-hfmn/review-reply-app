'use client';

import { CheckCircle, CircleDollarSign, Clock } from 'lucide-react';
import { useState } from 'react';

export function PromoCodeBanner() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('EARLYADAPTOR25');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = 'EARLYADAPTOR25';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-4 relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-5 md:p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-grid-white/10 bg-[length:20px_20px] animate-pulse" />

      {/* Content */}
      <div className="relative z-10">


        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
          🎉 Launch Special: 30% Off All Plans!
        </h3>

        <p className="text-white/90 text-sm md:text-base mb-4 md:mb-6  max-w-2xl mx-auto">
          Celebrate our launch with exclusive savings. Limited time offer - available for all plans while supplies last!
        </p>

        {/* Promo Code Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6 max-w-sm mx-auto border border-white/30">
          <div className="text-white/80 text-xs md:text-sm mb-2 font-medium">
            Use promo code at checkout:
          </div>
          <div className="bg-white/30 rounded-lg px-4 py-3 mb-3 border border-white/40">
            <code className="text-white font-bold text-lg md:text-xl tracking-wider">
              EARLYADAPTOR
            </code>
          </div>
          <button
            onClick={copyToClipboard}
            className="text-white/90 hover:text-white text-xs underline transition-colors"
          >
            {copied ? '✓ Copied!' : 'Click to copy code'}
          </button>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 text-white/80 text-xs md:text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-center sm:text-left">All plans included</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="text-center sm:text-left">Limited time only</span>
          </div>
          <div className="flex items-center gap-1">
            <CircleDollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="text-center sm:text-left">Applies for 6 months</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-2 left-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-2 right-2 w-20 h-20 bg-white/10 rounded-full blur-xl" />
    </div>
  );
}
