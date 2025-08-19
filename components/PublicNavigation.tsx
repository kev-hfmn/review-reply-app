'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Link as ScrollLink } from 'react-scroll';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

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

  return (
    <nav className="sticky top-0 z-50 bg-white/75 shadow-lg dark:bg-[#0B1120]/75 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-4">
          {/* Logo */}
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Image
              src="/icons/icon.png"
              alt="RepliFast"
              width={30}
              height={30}
              className="rounded-md"
            />
            <span className="text-xl font-bold leading-tight text-slate-900 dark:text-white">RepliFast</span>
          </div>

          {/* Desktop Navigation - Centered */}
          {navigationSections.length > 0 && (
            <div className="flex-1 flex justify-center">
              <div className="hidden md:flex items-center space-x-8">
                {navigationSections.map((section) => (
                  showScrollLinks && section.id !== 'contact' ? (
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
                          ? 'text-black dark:text-slate-50 font-medium'
                          : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-slate-400'
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
                        } else {
                          router.push(`/#${section.id}`);
                        }
                      }}
                      className="cursor-pointer transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-slate-50"
                    >
                      {section.title}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4 ml-auto">
            {user ? (
              <Button onClick={() => router.push('/dashboard')} className="" variant="primary">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')} className="hidden sm:inline-flex">
                  Sign In
                </Button>
                <Button onClick={() => router.push('/dashboard')} className="" variant="primary">
                  Start now
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
