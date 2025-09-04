'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Custom hook for localStorage with SSR safety
function useLocalStorage(key: string, initialValue: string[]) {
  const [storedValue, setStoredValue] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: string[] | ((val: string[]) => string[])) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}

interface FavoritesContextType {
  favorites: string[]
  addFavorite: (serviceId: string) => void
  removeFavorite: (serviceId: string) => void
  toggleFavorite: (serviceId: string) => void
  isFavorite: (serviceId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

interface FavoritesProviderProps {
  children: ReactNode
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useLocalStorage('cloudglass-favorites', ['s3', 'sqs'])

  const addFavorite = (serviceId: string) => {
    setFavorites(prev => {
      if (!prev.includes(serviceId)) {
        return [...prev, serviceId]
      }
      return prev
    })
  }

  const removeFavorite = (serviceId: string) => {
    setFavorites(prev => prev.filter(id => id !== serviceId))
  }

  const toggleFavorite = (serviceId: string) => {
    setFavorites(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const isFavorite = (serviceId: string) => {
    return favorites.includes(serviceId)
  }

  const value: FavoritesContextType = {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
