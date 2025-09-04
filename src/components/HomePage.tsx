'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock,
  Search,
  Star,
  CheckCircle
} from 'lucide-react'
import { useFavorites } from '@/contexts/FavoritesContext'
import { servicesConfig, type ServiceConfig } from '@/lib/services-config'

interface HomePageProps {
  onServiceChange: (service: string) => void
  searchQuery: string
}

export function HomePage({ onServiceChange, searchQuery }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { favorites, toggleFavorite, isFavorite } = useFavorites()

  const services = servicesConfig

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeServices = filteredServices.filter(service => service.status === 'active')
  const comingSoonServices = filteredServices.filter(service => service.status === 'coming-soon')
  const pinnedServicesList = filteredServices.filter(service => favorites.includes(service.id))
  const otherActiveServices = activeServices.filter(service => !favorites.includes(service.id))

  const handleServiceSelect = (serviceId: string) => {
    onServiceChange(serviceId)
  }

  const togglePin = (serviceId: string) => {
    toggleFavorite(serviceId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        )
      case 'coming-soon':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Services</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your cloud services with CloudGlass</p>
        </div>
        
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Pinned Services */}
        {pinnedServicesList.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pinned Services</h2>
            </div>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
              : "space-y-3"
            }>
              {pinnedServicesList.map((service) => {
                const IconComponent = service.icon
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    IconComponent={IconComponent}
                    viewMode={viewMode}
                    onSelect={handleServiceSelect}
                    onTogglePin={togglePin}
                    isPinned={true}
                    isFavorite={isFavorite}
                    getStatusBadge={getStatusBadge}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Available Services */}
        {otherActiveServices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Services</h2>
            </div>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
              : "space-y-3"
            }>
              {otherActiveServices.map((service) => {
                const IconComponent = service.icon
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    IconComponent={IconComponent}
                    viewMode={viewMode}
                    onSelect={handleServiceSelect}
                    onTogglePin={togglePin}
                    isPinned={false}
                    isFavorite={isFavorite}
                    getStatusBadge={getStatusBadge}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Coming Soon Services */}
        {comingSoonServices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Coming Soon</h2>
            </div>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
              : "space-y-3"
            }>
              {comingSoonServices.map((service) => {
                const IconComponent = service.icon
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    IconComponent={IconComponent}
                    viewMode={viewMode}
                    onSelect={handleServiceSelect}
                    onTogglePin={togglePin}
                    isPinned={false}
                    isFavorite={isFavorite}
                    getStatusBadge={getStatusBadge}
                    disabled={true}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No services found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Service Card Component
function ServiceCard({ 
  service, 
  IconComponent, 
  viewMode, 
  onSelect, 
  onTogglePin, 
  isPinned, 
  isFavorite,
  getStatusBadge, 
  disabled = false 
}: {
  service: ServiceConfig
  IconComponent: React.ComponentType<{ className?: string }>
  viewMode: 'grid' | 'list'
  onSelect: (id: string) => void
  onTogglePin: (id: string) => void
  isPinned: boolean
  isFavorite: (id: string) => boolean
  getStatusBadge: (status: string) => React.ReactNode
  disabled?: boolean
}) {
  if (viewMode === 'list') {
    return (
      <Card 
        className={`group transition-all duration-200 hover:shadow-md border ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' 
            : 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
        }`}
        onClick={() => !disabled && onSelect(service.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${service.bgColor} ${service.borderColor} border`}>
              <IconComponent className={`h-6 w-6 ${service.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</h3>
                {getStatusBadge(service.status)}
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePin(service.id)
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Star className={`h-4 w-4 ${isFavorite(service.id) ? 'text-yellow-500 fill-current' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{service.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{service.description}</p>
              {service.features && (
                <div className="flex flex-wrap gap-1">
                  {service.features.slice(0, 2).map((feature: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {service.features.length > 2 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      +{service.features.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-xs mb-2">{service.category}</Badge>
              {!disabled && (
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`group transition-all duration-200 hover:shadow-lg border ${
        disabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' 
          : 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:-translate-y-1'
      }`}
      onClick={() => !disabled && onSelect(service.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${service.bgColor} ${service.borderColor} border`}>
            <IconComponent className={`h-6 w-6 ${service.color}`} />
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(service.status)}
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin(service.id)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Star className={`h-4 w-4 ${isPinned ? 'text-yellow-500 fill-current' : 'text-gray-400 dark:text-gray-500'}`} />
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">{service.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{service.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">{service.description}</p>
          
          {/* Features */}
          {service.features && (
            <div className="flex flex-wrap gap-1 mb-3">
              {service.features.slice(0, 3).map((feature: string, index: number) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md"
                >
                  {feature}
                </span>
              ))}
              {service.features.length > 3 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
                  +{service.features.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">{service.category}</Badge>
          {!disabled && (
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white hover-lift"
            >
              Open
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}