'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, RotateCcw } from 'lucide-react'

export interface AWSConfigData {
  endpoint: string
  region: string
  accessKey: string
  secretKey: string
  forcePathStyle?: boolean
}

interface AWSConfigProps {
  isVisible: boolean
  config: AWSConfigData
  onConfigChange: (config: AWSConfigData) => void | Promise<void>
  showForcePathStyle?: boolean
  onValidationError?: (error: string) => void
  onSave?: (config: AWSConfigData) => void | Promise<void>
}

export function AWSConfig({ 
  isVisible, 
  config, 
  onConfigChange, 
  showForcePathStyle = false,
  onValidationError,
  onSave
}: AWSConfigProps) {
  const [localConfig, setLocalConfig] = useState<AWSConfigData>(config)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update local config when prop config changes
  useEffect(() => {
    setLocalConfig(config)
    setHasUnsavedChanges(false)
  }, [config])

  if (!isVisible) return null

  const validateConfig = (configToValidate: AWSConfigData = localConfig) => {
    if (!configToValidate.endpoint.trim()) {
      onValidationError?.('Endpoint is required')
      return false
    }
    
    if (!configToValidate.region.trim()) {
      onValidationError?.('Region is required')
      return false
    }
    
    if (!configToValidate.accessKey.trim()) {
      onValidationError?.('Access Key is required')
      return false
    }
    
    if (!configToValidate.secretKey.trim()) {
      onValidationError?.('Secret Key is required')
      return false
    }

    // Validate endpoint format
    try {
      new URL(configToValidate.endpoint)
    } catch {
      onValidationError?.('Invalid endpoint URL format')
      return false
    }

    return true
  }

  const handleInputChange = (field: keyof AWSConfigData, value: string | boolean) => {
    const newConfig = {
      ...localConfig,
      [field]: value
    }
    setLocalConfig(newConfig)
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!validateConfig()) return

    try {
      if (onSave) {
        await onSave(localConfig)
      } else {
        await onConfigChange(localConfig)
      }
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving config:', error)
      onValidationError?.(error instanceof Error ? error.message : 'Failed to save configuration')
    }
  }

  const handleReset = () => {
    setLocalConfig(config)
    setHasUnsavedChanges(false)
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Connection Settings</CardTitle>
        </div>
        <CardDescription>Configure your AWS connection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              value={localConfig.endpoint}
              onChange={(e) => handleInputChange('endpoint', e.target.value)}
              placeholder="https://localstack.me.test"
            />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={localConfig.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              placeholder="us-east-1"
            />
          </div>
          <div>
            <Label htmlFor="accessKey">Access Key</Label>
            <Input
              id="accessKey"
              value={localConfig.accessKey}
              onChange={(e) => handleInputChange('accessKey', e.target.value)}
              placeholder="test"
            />
          </div>
          <div>
            <Label htmlFor="secretKey">Secret Key</Label>
            <Input
              id="secretKey"
              value={localConfig.secretKey}
              onChange={(e) => handleInputChange('secretKey', e.target.value)}
              placeholder="test"
              type="password"
            />
          </div>
        </div>
        
        {showForcePathStyle && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="forcePathStyle"
              checked={localConfig.forcePathStyle || false}
              onChange={(e) => handleInputChange('forcePathStyle', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="forcePathStyle" className="text-sm">
              Force Path Style (for LocalStack compatibility)
            </Label>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={!hasUnsavedChanges}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
          <Button 
            onClick={handleReset} 
            disabled={!hasUnsavedChanges}
            variant="outline"
            className="px-3"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
