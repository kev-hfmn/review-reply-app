'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ContactButtons() {
  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={() => window.location.href = "/login"}
        className="text-foreground border-muted-foreground hover:bg-background hover:text-foreground transition-colors text-sm"
        variant="outline"
      >
        Sign Up
      </Button>
      <Button
        onClick={() => window.location.href = "mailto:hello@replifast.com"}
        className="text-foreground border-muted-foreground hover:bg-background hover:text-foreground transition-colors text-sm"
        variant="outline"
      >
        <Mail className="h-4 w-4 mr-0" />
        Contact Us
      </Button>
    </div>
  );
}
