/**
 * Cache Configuration
 * Centralized configuration for caching system
 */

export const CACHE_CONFIG = {
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    connectTimeout: 10000,
    commandTimeout: 5000
  },

  // Memory cache configuration
  memory: {
    maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE || '1000'),
    cleanupInterval: parseInt(process.env.MEMORY_CACHE_CLEANUP_INTERVAL || '60000') // 1 minute
  },

  // Client cache configuration
  client: {
    useSessionStorage: process.env.CLIENT_CACHE_SESSION === 'true',
    prefix: process.env.CLIENT_CACHE_PREFIX || 'kti_cache_',
    maxQuotaUsage: 0.8 // Use max 80% of available storage quota
  },

  // Default TTL values (in seconds)
  ttl: {
    veryShort: 60,      // 1 minute
    short: 300,         // 5 minutes
    medium: 900,        // 15 minutes
    long: 3600,         // 1 hour
    veryLong: 86400,    // 24 hours
    permanent: 0        // No expiration
  },

  // Cache levels configuration
  levels: {
    // Which cache levels to use for different data types
    masterData: ['redis', 'memory', 'client'],
    assets: ['redis', 'memory'],
    workflows: ['redis', 'memory'],
    reports: ['redis'],
    analytics: ['redis'],
    userPreferences: ['client'],
    staticData: ['client']
  },

  // Cache warming configuration
  warmup: {
    enabled: process.env.CACHE_WARMUP_ENABLED !== 'false',
    onStartup: process.env.CACHE_WARMUP_ON_STARTUP === 'true',
    endpoints: [
      '/api/masters/departments',
      '/api/masters/locations',
      '/api/masters/asset-classifications',
      '/api/masters/asset-groupings',
      '/api/masters/brands'
    ]
  },

  // Cache monitoring configuration
  monitoring: {
    enabled: process.env.CACHE_MONITORING_ENABLED !== 'false',
    logStats: process.env.CACHE_LOG_STATS === 'true',
    statsInterval: parseInt(process.env.CACHE_STATS_INTERVAL || '300000'), // 5 minutes
    alertThresholds: {
      hitRate: parseFloat(process.env.CACHE_HIT_RATE_THRESHOLD || '0.5'),
      memoryUsage: parseFloat(process.env.CACHE_MEMORY_THRESHOLD || '0.8'),
      errorRate: parseFloat(process.env.CACHE_ERROR_RATE_THRESHOLD || '0.1')
    }
  },

  // Cache invalidation configuration
  invalidation: {
    // Automatic invalidation rules
    rules: {
      assetCreated: ['assets', 'reports', 'analytics'],
      assetUpdated: ['assets', 'reports', 'analytics'],
      assetDeleted: ['assets', 'reports', 'analytics'],
      workflowStatusChanged: ['workflows', 'dashboard'],
      masterDataChanged: ['master-data'],
      userPermissionsChanged: ['users', 'dashboard']
    },
    
    // Batch invalidation settings
    batchSize: parseInt(process.env.CACHE_INVALIDATION_BATCH_SIZE || '100'),
    batchDelay: parseInt(process.env.CACHE_INVALIDATION_BATCH_DELAY || '1000') // 1 second
  }
}

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  // Shorter TTLs in development
  CACHE_CONFIG.ttl.short = 60
  CACHE_CONFIG.ttl.medium = 300
  CACHE_CONFIG.ttl.long = 900
  
  // Enable more verbose logging
  CACHE_CONFIG.monitoring.logStats = true
}

if (process.env.NODE_ENV === 'production') {
  // Longer TTLs in production
  CACHE_CONFIG.ttl.long = 7200 // 2 hours
  CACHE_CONFIG.ttl.veryLong = 172800 // 48 hours
  
  // Enable cache warmup on startup
  CACHE_CONFIG.warmup.onStartup = true
}

if (process.env.NODE_ENV === 'test') {
  // Disable Redis in tests
  CACHE_CONFIG.redis.url = ''
  
  // Use only memory cache for tests
  CACHE_CONFIG.levels.masterData = ['memory']
  CACHE_CONFIG.levels.assets = ['memory']
  CACHE_CONFIG.levels.workflows = ['memory']
  CACHE_CONFIG.levels.reports = ['memory']
  CACHE_CONFIG.levels.analytics = ['memory']
}

export default CACHE_CONFIG