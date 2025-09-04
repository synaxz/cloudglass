'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  Sun, 
  Moon, 
  MoreVertical,
  Cloud
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface TopNavigationProps {
  pageTitle: string
  onSettingsToggle: () => void
}

export function TopNavigation({ 
  pageTitle, 
  onSettingsToggle
}: TopNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">CloudGlass</span>
              <h1 className="text-sm text-gray-600 dark:text-gray-400">{pageTitle}</h1>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsToggle}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <div className="md:hidden relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {/* Mobile Dropdown */}
              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        toggleDarkMode()
                        setShowMobileMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                      {isDarkMode ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      <span className="text-sm">Toggle Theme</span>
                    </button>
                    <button
                      onClick={() => {
                        onSettingsToggle()
                        setShowMobileMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Backdrop for mobile menu */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </div>
  )
}
