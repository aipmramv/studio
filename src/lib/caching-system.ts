/**
 * Comprehensive Caching System
 * Provides multi-level caching with Redis, in-memory, and browser caching
 */

import cache from '@/config/cache'
import { createClient, RedisClientType } from 'redis'
import { z } from 'zod'

export interface CacheOptions {
    ttl?: number // Time to live in seconds
    tags?: string[] // Cache tags for invalidation
    namespace?: string // Cache namespace
    serialize?: boolean // Whether to serialize data
    compress?: boolean // Whether to compress data
}

export interface CacheEntry<T = any> {
    data: T
    timestamp: number
    ttl: number
    tags: string[]
    namespace: string
    compressed: boolean
}

export interface CacheStats {
    hits: number
    misses: number
    sets: number
    deletes: number
    hitRate: number
    totalKeys: number
    memoryUsage: number
}

export interface CacheInvalidationOptions {
    tags?: string[]
    namespace?: string
    pattern?: string
}

// Redis Cache Implementation
class RedisCache {
    private client: RedisClientType | null = null
    private connected = false
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0
    }

    constructor() {
        this.initializeClient()
    }

    private async initializeClient(): Promise<void> {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
            this.client = createClient({ url: redisUrl })

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err)
                this.connected = false
            })

            this.client.on('connect', () => {
                console.log('Redis Client Connected')
                this.connected = true
            })

            await this.client.connect()
        } catch (error) {
            console.error('Failed to initialize Redis client:', error)
            this.connected = false
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.connected || !this.client) {
            this.stats.misses++
            this.updateHitRate()
            return null
        }

        try {
            const data = await this.client.get(key)

            if (!data) {
                this.stats.misses++
                this.updateHitRate()
                return null
            }

            const entry: CacheEntry<T> = JSON.parse(data)

            // Check if expired
            if (this.isExpired(entry)) {
                await this.client.del(key)
                this.stats.misses++
                this.updateHitRate()
                return null
            }

            this.stats.hits++
            this.updateHitRate()

            return entry.compressed ? this.decompress(entry.data) : entry.data
        } catch (error) {
            console.error('Redis get error:', error)
            this.stats.misses++
            this.updateHitRate()
            return null
        }
    }

    async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
        if (!this.connected || !this.client) {
            return
        }

        const {
            ttl = 3600, // 1 hour default
            tags = [],
            namespace = 'default',
            compress = false
        } = options

        try {
            const processedData = compress ? this.compress(data) : data

            const entry: CacheEntry<T> = {
                data: processedData,
                timestamp: Date.now(),
                ttl,
                tags,
                namespace,
                compressed: compress
            }

            const serialized = JSON.stringify(entry)

            if (ttl > 0) {
                await this.client.setEx(key, ttl, serialized)
            } else {
                await this.client.set(key, serialized)
            }

            // Store tags for invalidation
            if (tags.length > 0) {
                for (const tag of tags) {
                    await this.client.sAdd(`tag:${tag}`, key)
                    if (ttl > 0) {
                        await this.client.expire(`tag:${tag}`, ttl)
                    }
                }
            }

            this.stats.sets++
        } catch (error) {
            console.error('Redis set error:', error)
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.connected || !this.client) {
            return
        }

        try {
            await this.client.del(key)
            this.stats.deletes++
        } catch (error) {
            console.error('Redis delete error:', error)
        }
    }

    async invalidate(options: CacheInvalidationOptions): Promise<void> {
        if (!this.connected || !this.client) {
            return
        }

        try {
            const { tags, namespace, pattern } = options

            if (tags && tags.length > 0) {
                for (const tag of tags) {
                    const keys = await this.client.sMembers(`tag:${tag}`)
                    if (keys.length > 0) {
                        await this.client.del(keys)
                        await this.client.del(`tag:${tag}`)
                    }
                }
            }

            if (pattern) {
                const keys = await this.client.keys(pattern)
                if (keys.length > 0) {
                    await this.client.del(keys)
                }
            }

            if (namespace) {
                const keys = await this.client.keys(`${namespace}:*`)
                if (keys.length > 0) {
                    await this.client.del(keys)
                }
            }
        } catch (error) {
            console.error('Redis invalidate error:', error)
        }
    }

    async clear(): Promise<void> {
        if (!this.connected || !this.client) {
            return
        }

        try {
            await this.client.flushDb()
        } catch (error) {
            console.error('Redis clear error:', error)
        }
    }

    getStats(): CacheStats {
        return { ...this.stats }
    }

    private isExpired(entry: CacheEntry): boolean {
        if (entry.ttl <= 0) return false
        return Date.now() - entry.timestamp > entry.ttl * 1000
    }

    private compress(data: any): any {
        // Simple compression using JSON stringify
        return JSON.stringify(data)
    }

    private decompress(data: any): any {
        try {
            return typeof data === 'string' ? JSON.parse(data) : data
        } catch {
            return data
        }
    }

    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
    }
}

// In-memory cache implementation
class MemoryCache {
    private cache = new Map<string, CacheEntry>()
    private accessOrder = new Map<string, number>()
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0
    }
    private maxSize: number
    private cleanupInterval: any

    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize
        this.startCleanup()
    }

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key)

        if (!entry) {
            this.stats.misses++
            this.updateHitRate()
            return null
        }

        // Check if expired
        if (this.isExpired(entry)) {
            this.cache.delete(key)
            this.accessOrder.delete(key)
            this.stats.misses++
            this.updateHitRate()
            return null
        }

        // Update access order for LRU
        this.accessOrder.set(key, Date.now())
        this.stats.hits++
        this.updateHitRate()

        return entry.compressed ? this.decompress(entry.data) : entry.data
    }

    async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
        const {
            ttl = 3600, // 1 hour default
            tags = [],
            namespace = 'default',
            compress = false
        } = options

        // Evict if at max size
        if (this.cache.size >= this.maxSize) {
            this.evictLRU()
        }

        const processedData = compress ? this.compress(data) : data

        const entry: CacheEntry<T> = {
            data: processedData,
            timestamp: Date.now(),
            ttl,
            tags,
            namespace,
            compressed: compress
        }

        this.cache.set(key, entry)
        this.accessOrder.set(key, Date.now())
        this.stats.sets++
        this.updateStats()
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key)
        this.accessOrder.delete(key)
        this.stats.deletes++
        this.updateStats()
    }

    async invalidate(options: CacheInvalidationOptions): Promise<void> {
        const { tags, namespace, pattern } = options
        const keysToDelete: string[] = []

        for (const [key, entry] of this.cache.entries()) {
            let shouldDelete = false

            if (tags && tags.length > 0) {
                shouldDelete = tags.some(tag => entry.tags.includes(tag))
            }

            if (namespace && entry.namespace === namespace) {
                shouldDelete = true
            }

            if (pattern) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'))
                shouldDelete = regex.test(key)
            }

            if (shouldDelete) {
                keysToDelete.push(key)
            }
        }

        for (const key of keysToDelete) {
            await this.delete(key)
        }
    }

    async clear(): Promise<void> {
        this.cache.clear()
        this.accessOrder.clear()
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            totalKeys: 0,
            memoryUsage: 0
        }
    }

    getStats(): CacheStats {
        this.updateStats()
        return { ...this.stats }
    }

    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired()
        }, 60000) // Cleanup every minute
    }

    private cleanupExpired(): void {
        const now = Date.now()
        const keysToDelete: string[] = []

        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                keysToDelete.push(key)
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key)
            this.accessOrder.delete(key)
        }

        this.updateStats()
    }

    private evictLRU(): void {
        let oldestKey: string | null = null
        let oldestTime = Date.now()

        for (const [key, time] of this.accessOrder.entries()) {
            if (time < oldestTime) {
                oldestTime = time
                oldestKey = key
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
            this.accessOrder.delete(oldestKey)
        }
    }

    private isExpired(entry: CacheEntry): boolean {
        if (entry.ttl <= 0) return false
        return Date.now() - entry.timestamp > entry.ttl * 1000
    }

    private compress(data: any): any {
        return JSON.stringify(data)
    }

    private decompress(data: any): any {
        try {
            return typeof data === 'string' ? JSON.parse(data) : data
        } catch {
            return data
        }
    }

    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
    }

    private updateStats(): void {
        this.stats.totalKeys = this.cache.size
        this.stats.memoryUsage = this.estimateMemoryUsage()
        this.updateHitRate()
    }

    private estimateMemoryUsage(): number {
        let size = 0
        for (const [key, entry] of this.cache.entries()) {
            size += key.length * 2 // UTF-16 characters
            size += JSON.stringify(entry).length * 2
        }
        return size
    }
}

// Client-side cache implementation for browser
class ClientCache {
    private storage: Storage
    private prefix: string
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0
    }

    constructor(useSessionStorage = false, prefix = 'kti_cache_') {
        this.storage = useSessionStorage ? sessionStorage : localStorage
        this.prefix = prefix
        this.loadStats()
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const fullKey = this.prefix + key
            const data = this.storage.getItem(fullKey)

            if (!data) {
                this.stats.misses++
                this.updateHitRate()
                this.saveStats()
                return null
            }

            const entry: CacheEntry<T> = JSON.parse(data)

            // Check if expired
            if (this.isExpired(entry)) {
                this.storage.removeItem(fullKey)
                this.stats.misses++
                this.updateHitRate()
                this.saveStats()
                return null
            }

            this.stats.hits++
            this.updateHitRate()
            this.saveStats()

            return entry.compressed ? this.decompress(entry.data) : entry.data
        } catch (error) {
            console.error('ClientCache get error:', error)
            this.stats.misses++
            this.updateHitRate()
            this.saveStats()
            return null
        }
    }

    async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
        const {
            ttl = 3600, // 1 hour default
            tags = [],
            namespace = 'default',
            compress = false
        } = options

        try {
            const processedData = compress ? this.compress(data) : data

            const entry: CacheEntry<T> = {
                data: processedData,
                timestamp: Date.now(),
                ttl,
                tags,
                namespace,
                compressed: compress
            }

            const fullKey = this.prefix + key
            this.storage.setItem(fullKey, JSON.stringify(entry))

            // Store tags for invalidation
            if (tags.length > 0) {
                this.updateTagIndex(key, tags)
            }

            this.stats.sets++
            this.updateStats()
            this.saveStats()
        } catch (error) {
            console.error('ClientCache set error:', error)
            // Handle quota exceeded error
            if (error instanceof DOMException && error.code === 22) {
                this.cleanup()
                // Try again after cleanup
                try {
                    const fullKey = this.prefix + key
                    this.storage.setItem(fullKey, JSON.stringify({
                        data: compress ? this.compress(data) : data,
                        timestamp: Date.now(),
                        ttl,
                        tags,
                        namespace,
                        compressed: compress
                    }))
                    this.stats.sets++
                } catch (retryError) {
                    console.error('ClientCache set retry failed:', retryError)
                }
            }
        }
    }

    async delete(key: string): Promise<void> {
        const fullKey = this.prefix + key
        this.storage.removeItem(fullKey)
        this.removeFromTagIndex(key)
        this.stats.deletes++
        this.updateStats()
        this.saveStats()
    }

    async invalidate(options: CacheInvalidationOptions): Promise<void> {
        const { tags, namespace, pattern } = options
        const keysToDelete: string[] = []

        // Get all cache keys
        for (let i = 0; i < this.storage.length; i++) {
            const fullKey = this.storage.key(i)
            if (!fullKey || !fullKey.startsWith(this.prefix)) continue

            const key = fullKey.substring(this.prefix.length)
            if (key.startsWith('stats_') || key.startsWith('tags_')) continue

            try {
                const data = this.storage.getItem(fullKey)
                if (!data) continue

                const entry: CacheEntry = JSON.parse(data)
                let shouldDelete = false

                if (tags && tags.length > 0) {
                    shouldDelete = tags.some(tag => entry.tags.includes(tag))
                }

                if (namespace && entry.namespace === namespace) {
                    shouldDelete = true
                }

                if (pattern) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
                    shouldDelete = regex.test(key)
                }

                if (shouldDelete) {
                    keysToDelete.push(key)
                }
            } catch (error) {
                console.error('Error parsing cache entry:', error)
                keysToDelete.push(key) // Delete corrupted entries
            }
        }

        for (const key of keysToDelete) {
            await this.delete(key)
        }
    }

    async clear(): Promise<void> {
        const keysToDelete: string[] = []

        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i)
            if (key && key.startsWith(this.prefix)) {
                keysToDelete.push(key)
            }
        }

        for (const key of keysToDelete) {
            this.storage.removeItem(key)
        }

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            totalKeys: 0,
            memoryUsage: 0
        }
        this.saveStats()
    }

    getStats(): CacheStats {
        this.updateStats()
        return { ...this.stats }
    }

    private cleanup(): void {
        const now = Date.now()
        const keysToDelete: string[] = []

        for (let i = 0; i < this.storage.length; i++) {
            const fullKey = this.storage.key(i)
            if (!fullKey || !fullKey.startsWith(this.prefix)) continue

            const key = fullKey.substring(this.prefix.length)
            if (key.startsWith('stats_') || key.startsWith('tags_')) continue

            try {
                const data = this.storage.getItem(fullKey)
                if (!data) continue

                const entry: CacheEntry = JSON.parse(data)
                if (this.isExpired(entry)) {
                    keysToDelete.push(key)
                }
            } catch (error) {
                keysToDelete.push(key) // Delete corrupted entries
            }
        }

        for (const key of keysToDelete) {
            this.storage.removeItem(this.prefix + key)
        }
    }

    private updateTagIndex(key: string, tags: string[]): void {
        for (const tag of tags) {
            const tagKey = this.prefix + 'tags_' + tag
            const existingKeys = this.storage.getItem(tagKey)
            const keys = existingKeys ? JSON.parse(existingKeys) : []

            if (!keys.includes(key)) {
                keys.push(key)
                this.storage.setItem(tagKey, JSON.stringify(keys))
            }
        }
    }

    private removeFromTagIndex(key: string): void {
        // Find all tag indexes and remove this key
        for (let i = 0; i < this.storage.length; i++) {
            const fullKey = this.storage.key(i)
            if (!fullKey || !fullKey.startsWith(this.prefix + 'tags_')) continue

            try {
                const keys = JSON.parse(this.storage.getItem(fullKey) || '[]')
                const index = keys.indexOf(key)
                if (index > -1) {
                    keys.splice(index, 1)
                    if (keys.length === 0) {
                        this.storage.removeItem(fullKey)
                    } else {
                        this.storage.setItem(fullKey, JSON.stringify(keys))
                    }
                }
            } catch (error) {
                console.error('Error updating tag index:', error)
            }
        }
    }

    private isExpired(entry: CacheEntry): boolean {
        if (entry.ttl <= 0) return false
        return Date.now() - entry.timestamp > entry.ttl * 1000
    }

    private compress(data: any): any {
        return JSON.stringify(data)
    }

    private decompress(data: any): any {
        try {
            return typeof data === 'string' ? JSON.parse(data) : data
        } catch {
            return data
        }
    }

    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
    }

    private updateStats(): void {
        let totalKeys = 0
        let memoryUsage = 0

        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i)
            if (key && key.startsWith(this.prefix) && !key.includes('stats_') && !key.includes('tags_')) {
                totalKeys++
                const data = this.storage.getItem(key)
                if (data) {
                    memoryUsage += key.length * 2 + data.length * 2
                }
            }
        }

        this.stats.totalKeys = totalKeys
        this.stats.memoryUsage = memoryUsage
        this.updateHitRate()
    }

    private saveStats(): void {
        try {
            this.storage.setItem(this.prefix + 'stats_', JSON.stringify(this.stats))
        } catch (error) {
            console.error('Failed to save cache stats:', error)
        }
    }

    private loadStats(): void {
        try {
            const data = this.storage.getItem(this.prefix + 'stats_')
            if (data) {
                this.stats = { ...this.stats, ...JSON.parse(data) }
            }
        } catch (error) {
            console.error('Failed to load cache stats:', error)
        }
    }
}

// Multi-level cache manager
export class CacheManager {
    private redisCache: RedisCache
    private memoryCache: MemoryCache
    private clientCache: ClientCache | null = null
    private isServer: boolean

    constructor(options: {
        maxMemorySize?: number
        useSessionStorage?: boolean
        cachePrefix?: string
    } = {}) {
        this.isServer = typeof window === 'undefined'
        this.redisCache = new RedisCache()
        this.memoryCache = new MemoryCache(options.maxMemorySize)

        if (!this.isServer) {
            this.clientCache = new ClientCache(
                options.useSessionStorage,
                options.cachePrefix
            )
        }
    }

    async get<T>(key: string, options: { level?: 'redis' | 'memory' | 'client' | 'all' } = {}): Promise<T | null> {
        const { level = 'all' } = options

        if (level === 'redis' || level === 'all') {
            const result = await this.redisCache.get<T>(key)
            if (result !== null) {
                // Populate lower levels
                if (level === 'all') {
                    await this.memoryCache.set(key, result, { ttl: 300 }) // 5 min in memory
                    if (this.clientCache) {
                        await this.clientCache.set(key, result, { ttl: 300 })
                    }
                }
                return result
            }
        }

        if ((level === 'memory' || level === 'all') && this.isServer) {
            const result = await this.memoryCache.get<T>(key)
            if (result !== null) {
                return result
            }
        }

        if ((level === 'client' || level === 'all') && this.clientCache) {
            const result = await this.clientCache.get<T>(key)
            if (result !== null) {
                return result
            }
        }

        return null
    }

    async set<T>(key: string, data: T, options: CacheOptions & { level?: 'redis' | 'memory' | 'client' | 'all' } = {}): Promise<void> {
        const { level = 'all', ...cacheOptions } = options

        if (level === 'redis' || level === 'all') {
            await this.redisCache.set(key, data, cacheOptions)
        }

        if ((level === 'memory' || level === 'all') && this.isServer) {
            await this.memoryCache.set(key, data, { ...cacheOptions, ttl: Math.min(cacheOptions.ttl || 3600, 1800) })
        }

        if ((level === 'client' || level === 'all') && this.clientCache) {
            await this.clientCache.set(key, data, { ...cacheOptions, ttl: Math.min(cacheOptions.ttl || 3600, 900) })
        }
    }

    async delete(key: string, options: { level?: 'redis' | 'memory' | 'client' | 'all' } = {}): Promise<void> {
        const { level = 'all' } = options

        if (level === 'redis' || level === 'all') {
            await this.redisCache.delete(key)
        }

        if ((level === 'memory' || level === 'all') && this.isServer) {
            await this.memoryCache.delete(key)
        }

        if ((level === 'client' || level === 'all') && this.clientCache) {
            await this.clientCache.delete(key)
        }
    }

    async invalidate(options: CacheInvalidationOptions & { level?: 'redis' | 'memory' | 'client' | 'all' }): Promise<void> {
        const { level = 'all', ...invalidationOptions } = options

        if (level === 'redis' || level === 'all') {
            await this.redisCache.invalidate(invalidationOptions)
        }

        if ((level === 'memory' || level === 'all') && this.isServer) {
            await this.memoryCache.invalidate(invalidationOptions)
        }

        if ((level === 'client' || level === 'all') && this.clientCache) {
            await this.clientCache.invalidate(invalidationOptions)
        }
    }

    async clear(options: { level?: 'redis' | 'memory' | 'client' | 'all' } = {}): Promise<void> {
        const { level = 'all' } = options

        if (level === 'redis' || level === 'all') {
            await this.redisCache.clear()
        }

        if ((level === 'memory' || level === 'all') && this.isServer) {
            await this.memoryCache.clear()
        }

        if ((level === 'client' || level === 'all') && this.clientCache) {
            await this.clientCache.clear()
        }
    }

    getStats(level?: 'redis' | 'memory' | 'client'): CacheStats | Record<string, CacheStats> {
        if (level === 'redis') {
            return this.redisCache.getStats()
        }

        if (level === 'memory') {
            return this.memoryCache.getStats()
        }

        if (level === 'client' && this.clientCache) {
            return this.clientCache.getStats()
        }

        const stats: Record<string, CacheStats> = {
            redis: this.redisCache.getStats(),
            memory: this.memoryCache.getStats()
        }

        if (this.clientCache) {
            stats.client = this.clientCache.getStats()
        }

        return stats
    }
}

// API Response Caching Middleware
export function createApiCacheMiddleware(cacheManager: CacheManager) {
    return function apiCacheMiddleware(options: {
        ttl?: number
        tags?: string[]
        keyGenerator?: (req: any) => string
        shouldCache?: (req: any, res: any) => boolean
    } = {}) {
        const {
            ttl = 300, // 5 minutes default
            tags = [],
            keyGenerator = (req) => `api:${req.method}:${req.url}`,
            shouldCache = (req, res) => req.method === 'GET' && res.status === 200
        } = options

        return async function middleware(req: any, res: any, next: any) {
            const cacheKey = keyGenerator(req)

            // Try to get from cache
            const cached = await cacheManager.get(cacheKey)
            if (cached) {
                return res.json(cached)
            }

            // Intercept response
            const originalJson = res.json
            res.json = function (data: any) {
                if (shouldCache(req, res)) {
                    cacheManager.set(cacheKey, data, { ttl, tags }).catch(console.error)
                }
                return originalJson.call(this, data)
            }

            next()
        }
    }
}

// Cache decorators for functions
export function cached(options: CacheOptions & { key?: string } = {}) {
    return function decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value
        const cacheManager = new CacheManager()

        descriptor.value = async function (...args: any[]) {
            const cacheKey = options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`

            const cached = await cacheManager.get(cacheKey)
            if (cached !== null) {
                return cached
            }

            const result = await originalMethod.apply(this, args)
            await cacheManager.set(cacheKey, result, options)

            return result
        }

        return descriptor
    }
}

// Singleton cache manager instance
export const cacheManager = new CacheManager()

// Utility functions
export const cacheUtils = {
    generateKey: (prefix: string, ...parts: (string | number)[]): string => {
        return `${prefix}:${parts.join(':')}`
    },

    generateUserKey: (userId: string, resource: string): string => {
        return `user:${userId}:${resource}`
    },

    generateDepartmentKey: (department: string, resource: string): string => {
        return `dept:${department}:${resource}`
    },

    generateAssetKey: (assetId: string): string => {
        return `asset:${assetId}`
    },

    generateWorkflowKey: (workflowId: string): string => {
        return `workflow:${workflowId}`
    },

    generateReportKey: (type: string, filters: Record<string, any>): string => {
        const filterHash = Buffer.from(JSON.stringify(filters)).toString('base64')
        return `report:${type}:${filterHash}`
    }
}