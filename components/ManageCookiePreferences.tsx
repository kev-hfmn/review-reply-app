'use client';

import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { showCookiePreferences } from '@/lib/cookieConsent';

interface ManageCookiePreferencesProps {
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ManageCookiePreferences = ({ 
  children, 
  variant = 'outline',
  size = 'default',
  className = ''
}: ManageCookiePreferencesProps) => {
  const handleClick = () => {
    showCookiePreferences();
  };

  return (
    <Button 
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      <Settings className="h-4 w-4 mr-2" />
      {children || 'Manage Cookie Preferences'}
    </Button>
  );
};

export default ManageCookiePreferences;