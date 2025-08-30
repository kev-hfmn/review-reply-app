'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

export function useThemeSafe() {
  const [mounted, setMounted] = useState(false)
  
  // Always call useTheme - hooks must be called in the same order every time
  let themeContext
  try {
    themeContext = useTheme()
  } catch (error) {
    // Theme context not available, will use defaults
    themeContext = null
  }
  
  // Only access theme context after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])
  
  let theme = 'light'
  let toggleTheme = () => {}
  
  if (mounted && themeContext) {
    theme = themeContext.theme
    toggleTheme = themeContext.toggleTheme
  }
  
  return { theme, toggleTheme, mounted }
}