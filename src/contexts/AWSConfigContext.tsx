'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AWSConfigData } from '@/components/AWSConfig'

interface AWSConfigContextType {
  config: AWSConfigData
  updateConfig: (newConfig: AWSConfigData) => Promise<void>
  saveConfig: (newConfig: AWSConfigData) => Promise<void>
  resetConfig: () => Promise<void>
  isConfigValid: boolean
  isLoading: boolean
  error: string | null
}

const AWSConfigContext = createContext<AWSConfigContextType | undefined>(undefined)

const DEFAULT_CONFIG: AWSConfigData = {
  endpoint: 'https://localstack.me.test',
  accessKey: 'test',
  secretKey: 'test',
  region: 'us-east-1',
  forcePathStyle: true
}

interface AWSConfigProviderProps {
  children: ReactNode
}

export function AWSConfigProvider({ children }: AWSConfigProviderProps) {
  const [config, setConfig] = useState<AWSConfigData>(DEFAULT_CONFIG)
  const [isConfigValid, setIsConfigValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load config from backend on mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/aws-config')
      const result = await response.json()
      
      if (result.success && result.data) {
        setConfig(result.data)
        setIsConfigValid(true)
      } else {
        console.error('Failed to load AWS config:', result.error)
        setError(result.error || 'Failed to load configuration')
        // Keep default config
      }
    } catch (error) {
      console.error('Error loading AWS config:', error)
      setError('Failed to load configuration from server')
      // Keep default config
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = async (newConfig: AWSConfigData) => {
    setConfig(newConfig)
    setIsConfigValid(true)
    setError(null)
  }

  const saveConfig = async (newConfig: AWSConfigData) => {
    setError(null)
    
    try {
      const response = await fetch('/api/aws-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setConfig(result.data)
        setIsConfigValid(true)
      } else {
        throw new Error(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving AWS config:', error)
      setError(error instanceof Error ? error.message : 'Failed to save configuration')
      throw error
    }
  }

  const resetConfig = async () => {
    setError(null)
    
    try {
      const response = await fetch('/api/aws-config', {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setConfig(DEFAULT_CONFIG)
        setIsConfigValid(false)
      } else {
        throw new Error(result.error || 'Failed to reset configuration')
      }
    } catch (error) {
      console.error('Error resetting AWS config:', error)
      setError(error instanceof Error ? error.message : 'Failed to reset configuration')
      throw error
    }
  }

  const value: AWSConfigContextType = {
    config,
    updateConfig,
    saveConfig,
    resetConfig,
    isConfigValid,
    isLoading,
    error
  }

  return (
    <AWSConfigContext.Provider value={value}>
      {children}
    </AWSConfigContext.Provider>
  )
}

export function useAWSConfig() {
  const context = useContext(AWSConfigContext)
  if (context === undefined) {
    throw new Error('useAWSConfig must be used within an AWSConfigProvider')
  }
  return context
}
