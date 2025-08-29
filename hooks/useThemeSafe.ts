'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

export function useThemeSafe() {
  const [mounted, setMounted] = useState(false)
  
  // Only access theme context after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])
  
  let theme = 'light'
  let toggleTheme = () => {}
  
  if (mounted) {
    try {
      const themeContext = useTheme()
      theme = themeContext.theme
      toggleTheme = themeContext.toggleTheme
    } catch (error) {
      // Theme context not available, use defaults
    }
  }
  
  return { theme, toggleTheme, mounted }
}