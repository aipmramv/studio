/**
 * Test Setup
 * Global test configuration and mocks
 */

import { vi } from 'vitest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.REDIS_URL = ''
process.env.MEMORY_CACHE_MAX_SIZE = '100'

// Mock localStorage and sessionStorage for client cache tests
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
}

Object.defineProperty(global, 'localStorage', {
  value: mockStorage
})

Object.defineProperty(global, 'sessionStorage', {
  value: mockStorage
})

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockStorage,
    sessionStorage: mockStorage
  }
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  mockStorage.getItem.mockReturnValue(null)
  mockStorage.length = 0
})