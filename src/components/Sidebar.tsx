'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  HardDrive,
  MessageSquare,
  Zap,
  Database,
  Server,
  Globe,
  ChevronDown,
  ChevronRight,
  Star,
  CheckCircle,
  Clock,
  Play,
  Settings,
  Search,
  Menu,
  X,
  Shield,
  Layers,
  Cpu,
  Network,
  FileText,
  Key,
  Cloud
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { servicesConfig, type ServiceConfig } from '@/lib/services-config'

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onSettingsToggle: () => void
}

// Service interface is now imported from services-config

export function Sidebar({ 
  isCollapsed, 
  onToggleCollapse, 
  searchQuery, 
  onSearchChange, 
  onSettingsToggle
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Storage', 'Messaging'])
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const { } = useTheme()

  // Create dashboard service and combine with shared services config
  const dashboardService: ServiceConfig = {
    id: 'home',
    name: 'Dashboard',
    fullName: 'CloudGlass Dashboard',
    shortName: 'Overview',
    icon: Home,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    hoverColor: 'hover:bg-slate-100',
    status: 'active',
    category: 'Dashboard',
    description: 'CloudGlass overview and quick access',
    features: ['Overview', 'Quick Access', 'Service Status', 'Recent Activity']
  }

  const services: ServiceConfig[] = [dashboardService, ...servicesConfig]

  // Separate Dashboard from other services
  const otherServices = services.filter(service => service.id !== 'home')
  
  // Group other services by category
  const servicesByCategory = otherServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, ServiceConfig[]>)

  const getCurrentService = () => {
    if (pathname === '/') return 'home'
    const serviceFromPath = pathname.split('/')[1]
    return serviceFromPath || 'home'
  }

  const currentService = getCurrentService()

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === 'home') {
      router.push('/')
    } else {
      router.push(`/${serviceId}`)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 text-xs px-2 py-0.5">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        )
      case 'running':
        return (
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 text-xs px-2 py-0.5">
            <Play className="h-3 w-3 mr-1" />
            Running
          </Badge>
        )
      case 'coming-soon':
        return (
          <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700 text-xs px-2 py-0.5">
            <Clock className="h-3 w-3 mr-1" />
            Soon
          </Badge>
        )
      default:
        return null
    }
  }

  const favoriteServices = otherServices.filter(service => favorites.includes(service.id))

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 relative ${
      isCollapsed ? 'w-16' : 'w-72 lg:w-80'
    }`}>
      {/* Resize Handle */}
      {!isCollapsed && (
        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-200 transition-colors duration-200 group">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">CloudGlass</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Dashboard - Collapsed */}
      {isCollapsed && dashboardService && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleServiceSelect(dashboardService.id)}
            className={`w-full flex justify-center p-2 rounded-lg transition-all duration-200 ${
              currentService === dashboardService.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-100'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={dashboardService.name}
          >
            <dashboardService.icon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Dashboard Section */}
      {!isCollapsed && dashboardService && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            {(() => {
              const IconComponent = dashboardService.icon
              const isActive = currentService === dashboardService.id
              return (
                <button
                  onClick={() => handleServiceSelect(dashboardService.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-blue-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${dashboardService.bgColor} ${dashboardService.borderColor} border`}>
                    <IconComponent className={`h-4 w-4 ${dashboardService.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                      {dashboardService.name}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {dashboardService.shortName}
                    </div>
                  </div>
                  {getStatusBadge(dashboardService.status)}
                </button>
              )
            })()}
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {!isCollapsed && favoriteServices.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Favorites</span>
          </div>
          <div className="space-y-1">
            {favoriteServices.map((service) => {
              const IconComponent = service.icon
              const isActive = currentService === service.id
              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-blue-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${service.bgColor} ${service.borderColor} border`}>
                    <IconComponent className={`h-4 w-4 ${service.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                      {service.name}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {service.shortName}
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Services by Category */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
          const isExpanded = expandedCategories.includes(category)
          const filteredServices = categoryServices.filter(service => 
            service.id !== 'home' && !favorites.includes(service.id) && (
              service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
          )

          if (filteredServices.length === 0 && !isCollapsed) return null

          return (
            <div key={category} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{category}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              ) : (
                <div className="px-4 py-3 group">
                  <div 
                    className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                    title={category}
                  >
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {category.charAt(0)}
                    </span>
                  </div>
                </div>
              )}

              {isExpanded && !isCollapsed && (
                <div className="pb-2">
                  {filteredServices.map((service) => {
                    const IconComponent = service.icon
                    const isActive = currentService === service.id
                    const isServiceFavorite = isFavorite(service.id)
                    
                    return (
                      <div key={service.id} className="px-4 py-1">
                        <button
                          onClick={() => handleServiceSelect(service.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-blue-700' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className={`p-1.5 rounded-md ${service.bgColor} ${service.borderColor} border`}>
                            <IconComponent className={`h-4 w-4 ${service.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                              {service.name}
                            </div>
                            <div className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                              {service.shortName}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(service.status)}
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(service.id)
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleFavorite(service.id)
                                }
                              }}
                            >
                              <Star className={`h-3 w-3 ${
                                isFavorite(service.id) ? 'text-yellow-500 fill-current' : 'text-gray-400 dark:text-gray-500'
                              }`} />
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsToggle}
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsToggle}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
