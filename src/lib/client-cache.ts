/**
 * Client-side caching utilities for static data and API responses
 */

import { cacheManager } from './caching-system'

export interface ClientCacheConfig {
  ttl: number
  tags: string[]
  namespace: string
}

// Client-side cache configurations
export const CLIENT_CACHE_CONFIGS = {
  MASTER_DATA: {
    ttl: 3600, // 1 hour
    tags: ['master-data', 'client'],
    namespace: 'client-masters'
  },
  USER_PREFERENCES: {
    ttl: 86400, // 24 hours
    tags: ['user-prefs', 'client'],
    namespace: 'client-prefs'
  },
  STATIC_DATA: {
    ttl: 7200, // 2 hours
    tags: ['static', 'client'],
    namespace: 'client-static'
  },
  API_RESPONSES: {
    ttl: 300, // 5 minutes
    tags: ['api', 'client'],
    namespace: 'client-api'
  }
}

export class ClientCacheManager {
  private static instance: ClientCacheManager

  static getInstance(): ClientCacheManager {
    if (!ClientCacheManager.instance) {
      ClientCacheManager.instance = new ClientCacheManager()
    }
    return ClientCacheManager.instance
  }

  // Cache master data
  async cacheMasterData(type: string, data: any[]): Promise<void> {
    const key = `masters:${type}`
    await cacheManager.set(key, data, {
      ...CLIENT_CACHE_CONFIGS.MASTER_DATA,
      level: 'client'
    })
  }

  async getMasterData(type: string): Promise<any[] | null> {
    const key = `masters:${type}`
    return cacheManager.get(key, { level: 'client' })
  }

  // Cache user preferences
  async cacheUserPreferences(userId: string, preferences: any): Promise<void> {
    const key = `user-prefs:${userId}`
    await cacheManager.set(key, preferences, {
      ...CLIENT_CACHE_CONFIGS.USER_PREFERENCES,
      level: 'client'
    })
  }

  async getUserPreferences(userId: string): Promise<any | null> {
    const key = `user-prefs:${userId}`
    return cacheManager.get(key, { level: 'client' })
  }

  // Cache API responses
  async cacheApiResponse(endpoint: string, params: Record<string, any>, data: any): Promise<void> {
    const key = this.generateApiKey(endpoint, params)
    await cacheManager.set(key, data, {
      ...CLIENT_CACHE_CONFIGS.API_RESPONSES,
      level: 'client'
    })
  }

  async getApiResponse(endpoint: string, params: Record<string, any>): Promise<any | null> {
    const key = this.generateApiKey(endpoint, params)
    return cacheManager.get(key, { level: 'client' })
  }

  // Cache static data
  async cacheStaticData(key: string, data: any, customTtl?: number): Promise<void> {
    await cacheManager.set(key, data, {
      ...CLIENT_CACHE_CONFIGS.STATIC_DATA,
      ttl: customTtl || CLIENT_CACHE_CONFIGS.STATIC_DATA.ttl,
      level: 'client'
    })
  }

  async getStaticData(key: string): Promise<any | null> {
    return cacheManager.get(key, { level: 'client' })
  }

  // Invalidation methods
  async invalidateMasterData(type?: string): Promise<void> {
    if (type) {
      await cacheManager.delete(`masters:${type}`, { level: 'client' })
    } else {
      await cacheManager.invalidate({
        tags: ['master-data'],
        level: 'client'
      })
    }
  }

  async invalidateUserPreferences(userId: string): Promise<void> {
    await cacheManager.delete(`user-prefs:${userId}`, { level: 'client' })
  }

  async invalidateApiCache(endpoint?: string): Promise<void> {
    if (endpoint) {
      await cacheManager.invalidate({
        pattern: `api:*${endpoint}*`,
        level: 'client'
      })
    } else {
      await cacheManager.invalidate({
        tags: ['api'],
        level: 'client'
      })
    }
  }

  async clearAll(): Promise<void> {
    await cacheManager.clear({ level: 'client' })
  }

  private generateApiKey(endpoint: string, params: Record<string, any>): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `api:${endpoint}${paramString ? ':' + paramString : ''}`
  }
}

// React hook for cached data fetching
export function useCachedFetch<T>(
  endpoint: string,
  params: Record<string, any> = {},
  options: {
    enabled?: boolean
    ttl?: number
    fallbackData?: T
  } = {}
) {
  const { enabled = true, ttl, fallbackData } = options
  const cacheManager = ClientCacheManager.getInstance()
  
  const [data, setData] = React.useState<T | null>(fallbackData || null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      // Try cache first
      const cached = await cacheManager.getApiResponse(endpoint, params)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }

      // Fetch from API
      const queryString = new URLSearchParams(params).toString()
      const url = `${endpoint}${queryString ? '?' + queryString : ''}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Cache the result
      await cacheManager.cacheApiResponse(endpoint, params, result)
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      if (fallbackData) {
        setData(fallbackData)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, JSON.stringify(params), enabled, fallbackData])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = React.useCallback(async () => {
    // Clear cache and refetch
    await cacheManager.invalidateApiCache(endpoint)
    await fetchData()
  }, [endpoint, fetchData])

  return {
    data,
    loading,
    error,
    refetch
  }
}

// React hook for master data
export function useMasterData(type: string) {
  const cacheManager = ClientCacheManager.getInstance()
  
  return useCachedFetch(`/api/masters/${type}`, {}, {
    ttl: CLIENT_CACHE_CONFIGS.MASTER_DATA.ttl
  })
}

// React hook for user preferences
export function useUserPreferences(userId: string) {
  const cacheManager = ClientCacheManager.getInstance()
  const [preferences, setPreferences] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const cached = await cacheManager.getUserPreferences(userId)
        if (cached) {
          setPreferences(cached)
        } else {
          // Load from API and cache
          const response = await fetch(`/api/users/${userId}/preferences`)
          if (response.ok) {
            const data = await response.json()
            await cacheManager.cacheUserPreferences(userId, data)
            setPreferences(data)
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadPreferences()
    }
  }, [userId])

  const updatePreferences = React.useCallback(async (newPreferences: any) => {
    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })

      if (response.ok) {
        await cacheManager.cacheUserPreferences(userId, newPreferences)
        setPreferences(newPreferences)
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error)
    }
  }, [userId])

  return {
    preferences,
    loading,
    updatePreferences
  }
}

// Singleton instance
export const clientCacheManager = ClientCacheManager.getInstance()

// Import React for hooks
import React from 'react'