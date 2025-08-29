'use client'

import { useState, ReactNode } from 'react'
import { PublicNavigation } from '@/components/PublicNavigation'
import NavigationManager from '@/components/NavigationManager'

interface NavigationWrapperProps {
  children: ReactNode;
  navigationSections: Array<{ id: string; title: string }>;
}

export default function NavigationWrapper({ children, navigationSections }: NavigationWrapperProps) {
  const [activeSection, setActiveSection] = useState("home")

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Navigation */}
      <PublicNavigation
        navigationSections={navigationSections}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        showScrollLinks={true}
      />

      {/* Navigation Manager */}
      <NavigationManager
        sections={navigationSections}
        onSectionChange={handleSectionChange}
      />

      {/* Page Content */}
      {children}
    </div>
  )
}