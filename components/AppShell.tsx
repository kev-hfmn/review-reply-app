'use client';

import { Sidebar } from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* TopBar */}
      <TopBar />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed */}
        <Sidebar />

        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto lg:ml-0">
          {/* Content area with padding */}
          <div className="p-6 lg:p-8">
            <div className="max-w-8xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
