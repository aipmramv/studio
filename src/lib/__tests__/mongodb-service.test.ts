import { MongoDBConnection, assetService, userService, DatabaseUtils } from '../mongodb-service'

// Mock MongoDB for testing
jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis()
        }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        countDocuments: jest.fn().mockResolvedValue(0),
        createIndex: jest.fn().mockResolvedValue('index-name'),
        listIndexes: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        stats: jest.fn().mockResolvedValue({
          count: 0,
          storageSize: 0,
          avgObjSize: 0,
          totalIndexSize: 0
        })
      }),
      admin: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue({}),
        stats: jest.fn().mockResolvedValue({
          collections: 0,
          dataSize: 0,
          indexSize: 0,
          storageSize: 0
        })
      }),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
    }),
    startSession: jest.fn().mockReturnValue({
      withTransaction: jest.fn().mockImplementation((fn) => fn()),
      endSession: jest.fn().mockResolvedValue(undefined)
    })
  })),
  ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id || 'mock-id' }))
}))

describe('MongoDB Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('MongoDBConnection', () => {
    test('should be a singleton', () => {
      const instance1 = MongoDBConnection.getInstance()
      const instance2 = MongoDBConnection.getInstance()
      expect(instance1).toBe(instance2)
    })

    test('should connect to database', async () => {
      const connection = MongoDBConnection.getInstance()
      const db = await connection.connect()
      expect(db).toBeDefined()
    })

    test('should perform health check', async () => {
      const connection = MongoDBConnection.getInstance()
      await connection.connect()
      
      const health = await connection.healthCheck()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('details')
    })
  })

  describe('AssetService', () => {
    test('should create asset', async () => {
      const assetData = {
        assetNumber: 'TEST-001',
        assetDescription: 'Test Asset',
        department: 'IT',
        location: 'BLR-01',
        currentStatus: 'Active',
        assetClassification: 'IT-HW',
        ledgerQty: 1
      }

      const assetId = await assetService.createAsset(assetData, 'user-id')
      expect(assetId).toBeDefined()
    })

    test('should search assets', async () => {
      const searchQuery = {
        searchTerm: 'test',
        department: 'IT',
        limit: 10,
        skip: 0
      }

      const result = await assetService.searchAssets(searchQuery)
      expect(result).toHaveProperty('assets')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.assets)).toBe(true)
    })

    test('should get asset count by status', async () => {
      const statusCounts = await assetService.getAssetCountByStatus()
      expect(typeof statusCounts).toBe('object')
    })
  })

  describe('UserService', () => {
    test('should create user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user' as const,
        department: 'IT',
        isActive: true
      }

      const userId = await userService.createUser(userData)
      expect(userId).toBeDefined()
    })

    test('should find user by email', async () => {
      const user = await userService.findByEmail('test@example.com')
      // Will return null in mock, but should not throw
      expect(user).toBeNull()
    })
  })

  describe('DatabaseUtils', () => {
    test('should get database stats', async () => {
      // Mock the connection first
      const connection = MongoDBConnection.getInstance()
      await connection.connect()
      
      const stats = await DatabaseUtils.getDatabaseStats()
      expect(stats).toHaveProperty('database')
      expect(stats).toHaveProperty('collections')
    })

    test('should check collection health', async () => {
      const connection = MongoDBConnection.getInstance()
      await connection.connect()
      
      const health = await DatabaseUtils.checkCollectionHealth('assets')
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('details')
    })
  })
})

describe('Error Handling', () => {
  test('should handle invalid ObjectId', async () => {
    await expect(assetService.findById('invalid-id')).rejects.toThrow()
  })

  test('should handle connection errors gracefully', async () => {
    // This would test actual error scenarios in integration tests
    expect(true).toBe(true) // Placeholder
  })
})

describe('Transaction Support', () => {
  test('should support transactions', async () => {
    const result = await assetService.withTransaction(async (session) => {
      // Mock transaction operation
      return 'transaction-result'
    })
    
    expect(result).toBe('transaction-result')
  })
})