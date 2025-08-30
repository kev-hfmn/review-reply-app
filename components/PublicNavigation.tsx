'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Link as ScrollLink } from 'react-scroll';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationSection {
  id: string;
  title: string;
}

interface PublicNavigationProps {
  navigationSections?: NavigationSection[];
  activeSection?: string;
  setActiveSection?: (section: string) => void;
  showScrollLinks?: boolean;
}

export function PublicNavigation({
  navigationSections = [],
  activeSection = '',
  setActiveSection = () => {},
  showScrollLinks = false
}: PublicNavigationProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileLinkClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleMobileScrollLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/75 shadow-lg backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Image
              src="/icons/icon.png"
              alt="RepliFast"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="text-xl font-bold leading-tight text-foreground">RepliFast</span>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
              {/* Dynamic Navigation Sections */}
              {navigationSections.map((section) =>
                showScrollLinks && !['contact', 'blog', 'home'].includes(section.id) ? (
                  <ScrollLink
                    key={section.id}
                    to={section.id}
                    spy={true}
                    smooth={true}
                    offset={-100}
                    duration={500}
                    onSetActive={() => setActiveSection(section.id)}
                    className={`cursor-pointer transition-colors duration-200 ${
                      activeSection === section.id
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {section.title}
                  </ScrollLink>
                ) : (
                  <button
                    key={section.id}
                    onClick={() => {
                      if (section.id === 'contact') {
                        router.push('/contact');
                      } else if (section.id === 'blog') {
                        router.push('/blog');
                      } else if (section.id === 'home') {
                        router.push('/');
                      } else {
                        router.push(`/#${section.id}`);
                      }
                    }}
                    className="cursor-pointer transition-colors duration-200 text-muted-foreground hover:text-foreground"
                  >
                    {section.title}
                  </button>
                )
              )}
            </div>
          </div>

          {/* CTA Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button onClick={() => router.push('/dashboard')} variant="primary">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="primary">
                  Start now
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigationSections.map((section) =>
              showScrollLinks && !['contact', 'blog', 'home'].includes(section.id) ? (
                <ScrollLink
                  key={section.id}
                  to={section.id}
                  spy={true}
                  smooth={true}
                  offset={-100}
                  duration={500}
                  onSetActive={() => setActiveSection(section.id)}
                  onClick={handleMobileScrollLinkClick}
                  className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                    activeSection === section.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {section.title}
                </ScrollLink>
              ) : (
                <button
                  key={section.id}
                  onClick={() => {
                    let path = `/#${section.id}`;
                    if (section.id === 'contact') path = '/contact';
                    if (section.id === 'blog') path = '/blog';
                    if (section.id === 'home') path = '/';
                    handleMobileLinkClick(path);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  {section.title}
                </button>
              )
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            <div className="px-2 space-y-2">
              {user ? (
                <Button onClick={() => handleMobileLinkClick('/dashboard')} className="w-full" variant="primary">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => handleMobileLinkClick('/login')} className="w-full">
                    Sign In
                  </Button>
                  <Button onClick={() => handleMobileLinkClick('/dashboard')} className="w-full" variant="primary">
                    Start now
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
