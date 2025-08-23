'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  Moon,
  Sun,
  Building2,
  User
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  { name: 'Insights', href: '/digest', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
  { name: 'Profile', href: '/profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { businessName } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-background shadow-lg border border-border lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 h-full
        w-64 bg-primary/5 border-r border-border
        transition-transform duration-300 ease-in-out flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo area - hidden on mobile since it's in TopBar */}
          <div className="hidden lg:flex h-16 items-center px-6 border-b border-border">
            <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
              <span className="font-normal leading-tighter text-foreground/90">
                {businessName || 'Your Business'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-primary hover:text-accent-foreground'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Theme</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {theme === 'light' ? 'Light' : 'Dark'}
                </span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle theme"
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              © 2025 RepliFast
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
