'use client'

import { useState, useEffect } from 'react'

interface NavigationSection {
  id: string
  title: string
}

interface NavigationManagerProps {
  sections: NavigationSection[]
  onSectionChange: (sectionId: string) => void
}

export default function NavigationManager({ sections, onSectionChange }: NavigationManagerProps) {
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset for fixed header

      // Get all section elements
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
        offset: document.getElementById(section.id)?.offsetTop || 0
      }))

      // Find the current section based on scroll position
      let currentSection = sections[0].id

      for (const section of sectionElements) {
        if (section.element && scrollPosition >= section.offset) {
          currentSection = section.id
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection)
        onSectionChange(currentSection)
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [sections, activeSection, onSectionChange])

  // This component doesn't render anything visible - it's just for managing state
  return null
}