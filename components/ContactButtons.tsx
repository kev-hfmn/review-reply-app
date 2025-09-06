'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ContactButtons() {
  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={() => window.location.href = "/login"}
        className="text-primary-foreground dark:border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors text-sm"
        variant="outline"
      >
        Sign Up
      </Button>
      <Button
        onClick={() => window.location.href = "mailto:hello@replifast.com"}
        className="text-primary-foreground dark:border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors text-sm"
        variant="outline"
      >
        <Mail className="h-4 w-4 mr-2" />
        Contact Us
      </Button>
    </div>
  );
}