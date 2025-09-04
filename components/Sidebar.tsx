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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Help', href: '/help', icon: HelpCircle },

];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { businesses, selectedBusinessId, setSelectedBusinessId } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar shadow-lg border border-border lg:hidden"
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
        w-64 bg-sidebar border-r border-border
        transition-transform duration-300 ease-in-out flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo area - hidden on mobile since it's in TopBar */}
          <div className="hidden lg:flex h-16 items-center pl-6 pr-2 border-b border-border">
            <div className="flex items-center gap-1 w-full min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-1" />
              {businesses.length > 1 ? (
                <Select
                  value={selectedBusinessId || ''}
                  onValueChange={setSelectedBusinessId}
                >
                  <SelectTrigger className="h-8 text-sm font-normal border-0 bg-transparent shadow-none px-2 py-1 focus:ring-0 hover:bg-accent/50 min-w-0 w-full flex-1">
                    <div className="truncate text-left">
                      {selectedBusinessId
                        ? businesses.find(b => b.id === selectedBusinessId)?.name
                        : "Select Business"
                      }
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{business.name}</span>
                          {business.industry && (
                            <span className="text-xs text-muted-foreground">{business.industry}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-medium leading-tighter text-foreground/90 truncate min-w-0 flex-1">
                  {businesses[0]?.name || 'Your Business'}
                </span>
              )}
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
                      : 'text-muted-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
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
                <span className="text-xs text-muted-foreground/75">
                  <Sun className="h-4 w-4 text-card-foreground/75" />
                </span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle theme"
                />
                <Moon className="h-4 w-4 text-card-foreground/75" />
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
