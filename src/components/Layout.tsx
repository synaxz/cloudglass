'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'
import { useTheme } from '@/contexts/ThemeContext'

interface LayoutProps {
  children: React.ReactNode
  pageTitle: string
  onSettingsToggle: () => void
}

export function Layout({ 
  children, 
  pageTitle, 
  onSettingsToggle 
}: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isDarkMode } = useTheme()

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          searchQuery=""
          onSearchChange={() => {}}
          onSettingsToggle={onSettingsToggle}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <TopNavigation
            pageTitle={pageTitle}
            onSettingsToggle={onSettingsToggle}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
