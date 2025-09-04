'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cloudglass-theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    } else {
      // Check system preference as fallback
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
    }
    setIsLoaded(true)
  }, [])

  // Save theme to localStorage and apply to document
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cloudglass-theme', isDarkMode ? 'dark' : 'light')
      
      // Apply theme to document root
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [isDarkMode, isLoaded])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 bg-white rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
