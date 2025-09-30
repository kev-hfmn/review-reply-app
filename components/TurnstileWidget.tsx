'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | undefined;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire, className }, ref) => {
    const turnstileRef = useRef<TurnstileInstance | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset();
      },
      getResponse: () => {
        return turnstileRef.current?.getResponse();
      }
    }));

    // Don't render if no site key is configured
    if (!siteKey) {
      console.warn('NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured - Turnstile disabled');
      return null;
    }

    console.log('🔥 TURNSTILE WIDGET - Site key configured:', siteKey.substring(0, 20) + '...');

    return (
      <div className={className}>
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={(token) => {
            console.log('🔥 TURNSTILE WIDGET - SUCCESS callback fired with token:', token);
            console.log('🔥 TURNSTILE WIDGET - Token length:', token?.length);
            if (onSuccess) onSuccess(token);
          }}
          onError={(errorCode) => {
            console.error('🔥 TURNSTILE WIDGET - ERROR:', errorCode);
            if (onError) onError();
          }}
          onExpire={() => {
            console.log('🔥 TURNSTILE WIDGET - EXPIRED');
            if (onExpire) onExpire();
          }}
          options={{
            theme: 'light',
            size: 'normal',
            retry: 'auto'
          }}
        />
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';