'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Cloud, MessageSquare, Settings, Zap, Database, Server, Globe, Plus, Home, Search, HardDrive } from 'lucide-react'

interface NavigationProps {
  currentService: string
  onServiceChange: (service: string) => void
  onSettingsToggle: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Navigation({ onSettingsToggle, searchQuery, onSearchChange }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)

  const services = [
    {
      id: 'home',
      name: 'Dashboard',
      description: 'CloudGlass overview',
      icon: Home,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      category: 'Overview'
    },
    {
      id: 's3',
      name: 'S3 Storage',
      description: 'Local storage management',
      icon: HardDrive,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      category: 'Storage'
    },
    {
      id: 'sqs',
      name: 'SQS Queues',
      description: 'Local message queues',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      disabled: false,
      category: 'Messaging'
    },
    {
      id: 'lambda',
      name: 'Lambda Functions',
      description: 'Local serverless compute',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      disabled: true,
      category: 'Compute'
    },
    {
      id: 'rds',
      name: 'RDS Databases',
      description: 'Local database management',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      disabled: true,
      category: 'Database'
    },
    {
      id: 'ec2',
      name: 'EC2 Instances',
      description: 'Local virtual servers',
      icon: Server,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      disabled: true,
      category: 'Compute'
    },
    {
      id: 'cloudfront',
      name: 'CloudFront',
      description: 'Local content delivery',
      icon: Globe,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      disabled: true,
      category: 'CDN'
    }
  ]

  // Determine current service from pathname
  const getCurrentService = () => {
    if (pathname === '/') return 'home'
    const serviceFromPath = pathname.split('/')[1]
    return serviceFromPath || 'home'
  }
  
  const currentServiceFromPath = getCurrentService()
  const currentServiceData = services.find(s => s.id === currentServiceFromPath)
  
  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, typeof services>)

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === 'home') {
      router.push('/')
    } else {
      router.push(`/${serviceId}`)
    }
    setIsOpen(false)
    setShowQuickMenu(false)
  }

  const quickActions = [
    { id: 'home', label: 'Dashboard', icon: Home, color: 'text-slate-600' },
    { id: 's3', label: 'S3', icon: HardDrive, color: 'text-blue-600' },
    { id: 'sqs', label: 'SQS', icon: MessageSquare, color: 'text-green-600' },
    { id: 'lambda', label: 'Lambda', icon: Zap, color: 'text-yellow-600' }
  ]

  return (
    <>
      {/* Minimal Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Cloud className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">CloudGlass</span>
              </button>
              
              {/* Services Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Services
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-white border-r border-gray-200">
                  <SheetHeader className="border-b border-gray-200 pb-4">
                    <SheetTitle className="text-gray-900 text-xl font-semibold">AWS Services</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {categoryServices.map((service) => {
                            const IconComponent = service.icon
                            return (
                              <div
                                key={service.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                  currentServiceFromPath === service.id
                                    ? `${service.borderColor} ${service.bgColor} shadow-sm`
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                } ${service.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !service.disabled && handleServiceSelect(service.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${service.bgColor} ${service.borderColor} border`}>
                                    <IconComponent className={`h-5 w-5 ${service.color}`} />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">{service.name}</h4>
                                    <p className="text-xs text-gray-600">{service.description}</p>
                                  </div>
                                  {service.disabled && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">
                                      Soon
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Center - Current Service */}
            {currentServiceData && pathname !== '/' && (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentServiceData.bgColor} ${currentServiceData.borderColor} border`}>
                  <currentServiceData.icon className={`h-5 w-5 ${currentServiceData.color}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{currentServiceData.name}</h2>
                  <p className="text-sm text-gray-500">{currentServiceData.description}</p>
                </div>
              </div>
            )}

            {/* Right side - Search and Settings */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-64"
                  aria-label="Search services"
                />
              </div>
              {/* Mobile Search Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* TODO: Add mobile search modal */}}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 sm:hidden"
              >
                <Search className="h-4 w-4" />
              </Button>
              {/* Settings Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsToggle}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Quick Actions Menu */}
          {showQuickMenu && (
            <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[200px]">
              <div className="text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-200">
                Quick Switch
              </div>
              <div className="space-y-1 py-2">
                {quickActions.map((action) => {
                  const IconComponent = action.icon
                  const isCurrent = currentServiceFromPath === action.id
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleServiceSelect(action.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 ${
                        isCurrent ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 ${action.color}`} />
                      <span className="text-sm font-medium">{action.label}</span>
                      {isCurrent && (
                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* FAB Button */}
          <Button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className={`h-12 w-12 rounded-full shadow-lg transition-all duration-300 ${
              showQuickMenu 
                ? 'bg-blue-600 hover:bg-blue-700 scale-110' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus className={`h-5 w-5 text-white transition-transform duration-300 ${
              showQuickMenu ? 'rotate-45' : 'rotate-0'
            }`} />
          </Button>
        </div>
      </div>

      {/* Backdrop for FAB menu */}
      {showQuickMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowQuickMenu(false)}
        />
      )}
    </>
  )
}
