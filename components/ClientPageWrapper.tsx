'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicNavigation } from '@/components/PublicNavigation'
import NavigationManager from '@/components/NavigationManager'

interface ClientPageWrapperProps {
  children: React.ReactNode
  navigationSections: Array<{ id: string; title: string }>
}

export default function ClientPageWrapper({ children, navigationSections }: ClientPageWrapperProps) {
  const [activeSection, setActiveSection] = useState("home")
  const router = useRouter()

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] relative">
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
