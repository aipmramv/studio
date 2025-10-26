/**
 * Cache Debug Test
 * Simple test to debug memory cache issues
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '../caching-system'

describe('Cache Debug', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager()
  })

  it('should debug memory cache', async () => {
    console.log('Starting cache debug test')
    console.log('typeof window:', typeof window)
    console.log('isServer should be:', typeof window === 'undefined')
    
    const key = 'debug-key'
    const data = { test: 'data' }

    console.log('Setting data in memory cache...')
    await cache.set(key, data, { level: 'memory' })
    
    console.log('Getting data from memory cache...')
    const result = await cache.get(key, { level: 'memory' })
    
    console.log('Result:', result)
    console.log('Expected:', data)
    
    // Let's also test the memory cache directly
    const memoryCache = (cache as any).memoryCache
    console.log('Direct memory cache get:', await memoryCache.get(key))
    
    expect(result).toEqual(data)
  })
})