'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const borderClasses = {
    sm: 'border',
    md: 'border',
    lg: 'border-2'
  };

  // Create a proxied URL to avoid CORS issues
  const getProxiedUrl = (url: string) => {
    if (!url) return null;
    
    // If it's already a Google avatar URL, add crossorigin parameter
    if (url.includes('googleusercontent.com')) {
      // Remove any existing size parameter and add our own
      const baseUrl = url.split('=')[0];
      return `${baseUrl}=s${size === 'lg' ? '40' : size === 'md' ? '32' : '24'}-c`;
    }
    
    return url;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const shouldShowImage = src && !imageError;
  const proxiedSrc = shouldShowImage ? getProxiedUrl(src) : null;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {shouldShowImage && proxiedSrc ? (
        <>
          <img
            src={proxiedSrc}
            alt={alt}
            className={`${sizeClasses[size]} rounded-full object-cover ${borderClasses[size]} border-muted`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {isLoading && (
            <div className={`absolute inset-0 bg-muted rounded-full flex items-center justify-center animate-pulse`}>
              <User className={`${iconSizes[size]} text-muted-foreground`} />
            </div>
          )}
        </>
      ) : (
        <div className={`${sizeClasses[size]} bg-muted rounded-full flex items-center justify-center`}>
          <User className={`${iconSizes[size]} text-muted-foreground`} />
        </div>
      )}
    </div>
  );
}
