import { MongoDBConnection, MigrationUtils, userService, assetService } from './mongodb-service'
import { Db, ClientSession } from 'mongodb'
import bcrypt from 'bcryptjs'

// Seed data interfaces
export interface SeedDataConfig {
  createAdminUser: boolean
  createSampleUsers: boolean
  createMasterData: boolean
  createSampleAssets: boolean
  runMigrations: boolean
}

export interface InitializationResult {
  success: boolean
  steps: Array<{
    step: string
    success: boolean
    message: string
    duration: number
  }>
  totalDuration: number
  errors: string[]
}

// Master data definitions
const MASTER_DATA_DEFINITIONS = {
  departments: [
    { code: 'IT', name: 'Information Technology', description: 'IT Department', isActive: true, order: 1 },
    { code: 'HR', name: 'Human Resources', description: 'Human Resources Department', isActive: true, order: 2 },
    { code: 'FIN', name: 'Finance', description: 'Finance Department', isActive: true, order: 3 },
    { code: 'OPS', name: 'Operations', description: 'Operations Department', isActive: true, order: 4 },
    { code: 'MKT', name: 'Marketing', description: 'Marketing Department', isActive: true, order: 5 },
    { code: 'ADMIN', name: 'Administration', description: 'Administration Department', isActive: true, order: 6 },
    { code: 'MAINT', name: 'Maintenance', description: 'Maintenance Department', isActive: true, order: 7 }
  ],
  
  locations: [
    { code: 'BLR-01', name: 'Bangalore Office - Floor 1', description: 'Main office building, first floor', isActive: true, order: 1 },
    { code: 'BLR-02', name: 'Bangalore Office - Floor 2', description: 'Main office building, second floor', isActive: true, order: 2 },
    { code: 'BLR-03', name: 'Bangalore Office - Floor 3', description: 'Main office building, third floor', isActive: true, order: 3 },
    { code: 'BLR-WH', name: 'Bangalore Warehouse', description: 'Main warehouse facility', isActive: true, order: 4 },
    { code: 'CHN-01', name: 'Chennai Office', description: 'Chennai branch office', isActive: true, order: 5 },
    { code: 'MUM-01', name: 'Mumbai Office', description: 'Mumbai branch office', isActive: true, order: 6 },
    { code: 'DEL-01', name: 'Delhi Office', description: 'Delhi branch office', isActive: true, order: 7 },
    { code: 'HYD-01', name: 'Hyderabad Office', description: 'Hyderabad branch office', isActive: true, order: 8 }
  ],
  
  assetClassifications: [
    { code: 'IT-HW', name: 'IT Hardware', description: 'Computer hardware and peripherals', isActive: true, order: 1 },
    { code: 'IT-SW', name: 'IT Software', description: 'Software licenses and applications', isActive: true, order: 2 },
    { code: 'FURN', name: 'Furniture', description: 'Office furniture and fixtures', isActive: true, order: 3 },
    { code: 'VEH', name: 'Vehicles', description: 'Company vehicles and transportation', isActive: true, order: 4 },
    { code: 'EQUIP', name: 'Equipment', description: 'General equipment and machinery', isActive: true, order: 5 },
    { code: 'TOOLS', name: 'Tools', description: 'Hand tools and small equipment', isActive: true, order: 6 },
    { code: 'SAFETY', name: 'Safety Equipment', description: 'Safety and security equipment', isActive: true, order: 7 },
    { code: 'COMM', name: 'Communication', description: 'Communication devices and systems', isActive: true, order: 8 }
  ],
  
  assetStatuses: [
    { code: 'ACTIVE', name: 'Active', description: 'Asset is in active use', isActive: true, order: 1 },
    { code: 'INACTIVE', name: 'Inactive', description: 'Asset is not currently in use', isActive: true, order: 2 },
    { code: 'MAINTENANCE', name: 'Under Maintenance', description: 'Asset is under maintenance or repair', isActive: true, order: 3 },
    { code: 'DISPOSED', name: 'Disposed', description: 'Asset has been disposed of', isActive: true, order: 4 },
    { code: 'LOST', name: 'Lost/Stolen', description: 'Asset is lost or stolen', isActive: true, order: 5 },
    { code: 'DAMAGED', name: 'Damaged', description: 'Asset is damaged and unusable', isActive: true, order: 6 },
    { code: 'RESERVED', name: 'Reserved', description: 'Asset is reserved for future use', isActive: true, order: 7 }
  ],
  
  assetGroupings: [
    { code: 'DESKTOP', name: 'Desktop Computers', description: 'Desktop computer systems', isActive: true, order: 1 },
    { code: 'LAPTOP', name: 'Laptops', description: 'Laptop computers', isActive: true, order: 2 },
    { code: 'MONITOR', name: 'Monitors', description: 'Computer monitors and displays', isActive: true, order: 3 },
    { code: 'PRINTER', name: 'Printers', description: 'Printing devices', isActive: true, order: 4 },
    { code: 'NETWORK', name: 'Network Equipment', description: 'Networking hardware', isActive: true, order: 5 },
    { code: 'SERVER', name: 'Servers', description: 'Server hardware', isActive: true, order: 6 },
    { code: 'MOBILE', name: 'Mobile Devices', description: 'Mobile phones and tablets', isActive: true, order: 7 },
    { code: 'STORAGE', name: 'Storage Devices', description: 'Storage and backup devices', isActive: true, order: 8 }
  ],
  
  vendors: [
    { code: 'DELL', name: 'Dell Technologies', description: 'Computer hardware vendor', isActive: true, order: 1 },
    { code: 'HP', name: 'HP Inc.', description: 'Computer and printer vendor', isActive: true, order: 2 },
    { code: 'LENOVO', name: 'Lenovo', description: 'Computer hardware vendor', isActive: true, order: 3 },
    { code: 'APPLE', name: 'Apple Inc.', description: 'Apple devices and computers', isActive: true, order: 4 },
    { code: 'CISCO', name: 'Cisco Systems', description: 'Network equipment vendor', isActive: true, order: 5 },
    { code: 'MICROSOFT', name: 'Microsoft Corporation', description: 'Software and hardware vendor', isActive: true, order: 6 },
    { code: 'CANON', name: 'Canon Inc.', description: 'Printer and imaging vendor', isActive: true, order: 7 },
    { code: 'EPSON', name: 'Epson', description: 'Printer vendor', isActive: true, order: 8 }
  ],
  
  workflowTypes: [
    { code: 'ASSET_TRANSFER', name: 'Asset Transfer', description: 'Transfer asset between locations/departments', isActive: true, order: 1 },
    { code: 'ASSET_DISPOSAL', name: 'Asset Disposal', description: 'Dispose of asset', isActive: true, order: 2 },
    { code: 'ASSET_PURCHASE', name: 'Asset Purchase', description: 'Purchase new asset', isActive: true, order: 3 },
    { code: 'ASSET_MAINTENANCE', name: 'Asset Maintenance', description: 'Schedule asset maintenance', isActive: true, order: 4 },
    { code: 'ASSET_VERIFICATION', name: 'Asset Verification', description: 'Verify asset existence and condition', isActive: true, order: 5 }
  ]
}

// Sample users data
const SAMPLE_USERS = [
  {
    name: 'John Admin',
    email: 'admin@kti.com',
    password: 'admin123',
    role: 'admin' as const,
    department: 'ADMIN',
    isActive: true
  },
  {
    name: 'Sarah IT Manager',
    email: 'sarah.it@kti.com',
    password: 'password123',
    role: 'spoc' as const,
    department: 'IT',
    isActive: true
  },
  {
    name: 'Mike HR Manager',
    email: 'mike.hr@kti.com',
    password: 'password123',
    role: 'spoc' as const,
    department: 'HR',
    isActive: true
  },
  {
    name: 'Lisa Finance Manager',
    email: 'lisa.finance@kti.com',
    password: 'password123',
    role: 'spoc' as const,
    department: 'FIN',
    isActive: true
  },
  {
    name: 'David IT User',
    email: 'david.it@kti.com',
    password: 'password123',
    role: 'user' as const,
    department: 'IT',
    isActive: true
  },
  {
    name: 'Emma HR User',
    email: 'emma.hr@kti.com',
    password: 'password123',
    role: 'user' as const,
    department: 'HR',
    isActive: true
  }
]

// Sample assets data
const SAMPLE_ASSETS = [
  {
    assetDescription: 'Dell OptiPlex 7090 Desktop',
    department: 'IT',
    location: 'BLR-01',
    currentStatus: 'ACTIVE',
    assetClassification: 'IT-HW',
    assetGrouping: 'DESKTOP',
    brandName: 'Dell',
    modelNo: 'OptiPlex 7090',
    productSerialNo: 'DL001234567',
    purchaseValue: 65000,
    ledgerQty: 1,
    capitalizationDate: new Date('2023-01-15'),
    lifecycleYears: 5
  },
  {
    assetDescription: 'HP LaserJet Pro M404n Printer',
    department: 'IT',
    location: 'BLR-01',
    currentStatus: 'ACTIVE',
    assetClassification: 'IT-HW',
    assetGrouping: 'PRINTER',
    brandName: 'HP',
    modelNo: 'LaserJet Pro M404n',
    productSerialNo: 'HP001234567',
    purchaseValue: 15000,
    ledgerQty: 1,
    capitalizationDate: new Date('2023-02-10'),
    lifecycleYears: 3
  },
  {
    assetDescription: 'Lenovo ThinkPad E14 Laptop',
    department: 'HR',
    location: 'BLR-02',
    currentStatus: 'ACTIVE',
    assetClassification: 'IT-HW',
    assetGrouping: 'LAPTOP',
    brandName: 'Lenovo',
    modelNo: 'ThinkPad E14',
    productSerialNo: 'LN001234567',
    purchaseValue: 55000,
    ledgerQty: 1,
    capitalizationDate: new Date('2023-03-05'),
    lifecycleYears: 4
  },
  {
    assetDescription: 'Cisco Catalyst 2960 Switch',
    department: 'IT',
    location: 'BLR-WH',
    currentStatus: 'ACTIVE',
    assetClassification: 'IT-HW',
    assetGrouping: 'NETWORK',
    brandName: 'Cisco',
    modelNo: 'Catalyst 2960',
    productSerialNo: 'CS001234567',
    purchaseValue: 45000,
    ledgerQty: 1,
    capitalizationDate: new Date('2023-01-20'),
    lifecycleYears: 7
  },
  {
    assetDescription: 'Executive Office Chair',
    department: 'ADMIN',
    location: 'BLR-01',
    currentStatus: 'ACTIVE',
    assetClassification: 'FURN',
    brandName: 'Steelcase',
    modelNo: 'Leap V2',
    purchaseValue: 25000,
    ledgerQty: 1,
    capitalizationDate: new Date('2023-02-15'),
    lifecycleYears: 10
  }
]

// Database initializer class
export class DatabaseInitializer {
  private connection: MongoDBConnection
  private db: Db | null = null

  constructor() {
    this.connection = MongoDBConnection.getInstance()
  }

  /**
   * Initialize the entire database system
   */
  async initialize(config: SeedDataConfig = {
    createAdminUser: true,
    createSampleUsers: false,
    createMasterData: true,
    createSampleAssets: false,
    runMigrations: true
  }): Promise<InitializationResult> {
    const startTime = Date.now()
    const result: InitializationResult = {
      success: true,
      steps: [],
      totalDuration: 0,
      errors: []
    }

    try {
      console.log('Starting database initialization...')
      
      // Connect to database
      await this.executeStep(result, 'Database Connection', async () => {
        this.db = await this.connection.connect()
      })

      // Create indexes
      await this.executeStep(result, 'Create Indexes', async () => {
        await this.createIndexes()
      })

      // Run migrations
      if (config.runMigrations) {
        await this.executeStep(result, 'Run Migrations', async () => {
          await this.runMigrations()
        })
      }

      // Create master data
      if (config.createMasterData) {
        await this.executeStep(result, 'Create Master Data', async () => {
          await this.createMasterData()
        })
      }

      // Create admin user
      if (config.createAdminUser) {
        await this.executeStep(result, 'Create Admin User', async () => {
          await this.createAdminUser()
        })
      }

      // Create sample users
      if (config.createSampleUsers) {
        await this.executeStep(result, 'Create Sample Users', async () => {
          await this.createSampleUsers()
        })
      }

      // Create sample assets
      if (config.createSampleAssets) {
        await this.executeStep(result, 'Create Sample Assets', async () => {
          await this.createSampleAssets()
        })
      }

      // Validate setup
      await this.executeStep(result, 'Validate Setup', async () => {
        await this.validateSetup()
      })

      result.totalDuration = Date.now() - startTime
      result.success = result.errors.length === 0

      console.log(`Database initialization completed in ${result.totalDuration}ms`)
      
      return result
    } catch (error) {
      result.success = false
      result.errors.push(`Initialization failed: ${error.message}`)
      result.totalDuration = Date.now() - startTime
      
      console.error('Database initialization failed:', error)
      return result
    }
  }

  /**
   * Execute a step and track its progress
   */
  private async executeStep(
    result: InitializationResult,
    stepName: string,
    stepFunction: () => Promise<void>
  ): Promise<void> {
    const stepStartTime = Date.now()
    
    try {
      console.log(`Executing step: ${stepName}`)
      await stepFunction()
      
      const duration = Date.now() - stepStartTime
      result.steps.push({
        step: stepName,
        success: true,
        message: `Completed successfully in ${duration}ms`,
        duration
      })
      
      console.log(`✓ ${stepName} completed in ${duration}ms`)
    } catch (error) {
      const duration = Date.now() - stepStartTime
      const errorMessage = `Failed: ${error.message}`
      
      result.steps.push({
        step: stepName,
        success: false,
        message: errorMessage,
        duration
      })
      
      result.errors.push(`${stepName}: ${errorMessage}`)
      console.error(`✗ ${stepName} failed:`, error)
      
      throw error
    }
  }

  /**
   * Create database indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    const indexOperations = [
      // Assets collection indexes
      {
        collection: 'assets',
        indexes: [
          { spec: { assetNumber: 1 }, options: { unique: true, name: 'idx_asset_number_unique' } },
          { spec: { department: 1 }, options: { name: 'idx_department' } },
          { spec: { location: 1 }, options: { name: 'idx_location' } },
          { spec: { currentStatus: 1 }, options: { name: 'idx_current_status' } },
          { spec: { assetClassification: 1 }, options: { name: 'idx_asset_classification' } },
          { spec: { department: 1, currentStatus: 1 }, options: { name: 'idx_dept_status' } },
          { 
            spec: { 
              assetNumber: 'text', 
              assetDescription: 'text', 
              brandName: 'text',
              modelNo: 'text',
              productSerialNo: 'text'
            }, 
            options: { 
              name: 'idx_text_search',
              weights: {
                assetNumber: 10,
                assetDescription: 5,
                brandName: 3,
                modelNo: 3,
                productSerialNo: 2
              }
            } 
          }
        ]
      },
      
      // Users collection indexes
      {
        collection: 'users',
        indexes: [
          { spec: { email: 1 }, options: { unique: true, name: 'idx_email_unique' } },
          { spec: { role: 1 }, options: { name: 'idx_role' } },
          { spec: { department: 1 }, options: { name: 'idx_user_department' } },
          { spec: { isActive: 1 }, options: { name: 'idx_is_active' } }
        ]
      },
      
      // Workflows collection indexes
      {
        collection: 'workflows',
        indexes: [
          { spec: { requesterId: 1 }, options: { name: 'idx_requester_id' } },
          { spec: { status: 1 }, options: { name: 'idx_workflow_status' } },
          { spec: { type: 1 }, options: { name: 'idx_workflow_type' } },
          { spec: { createdAt: -1 }, options: { name: 'idx_workflow_created_desc' } },
          { spec: { status: 1, createdAt: -1 }, options: { name: 'idx_status_created' } }
        ]
      },
      
      // Asset movements collection indexes
      {
        collection: 'assetMovements',
        indexes: [
          { spec: { assetId: 1 }, options: { name: 'idx_asset_id' } },
          { spec: { createdAt: -1 }, options: { name: 'idx_movement_created_desc' } },
          { spec: { assetId: 1, createdAt: -1 }, options: { name: 'idx_asset_movement_history' } }
        ]
      },
      
      // Master data collection indexes
      {
        collection: 'masterData',
        indexes: [
          { spec: { type: 1 }, options: { name: 'idx_master_type' } },
          { spec: { 'values.code': 1 }, options: { name: 'idx_master_code' } },
          { spec: { type: 1, 'values.isActive': 1 }, options: { name: 'idx_type_active' } }
        ]
      }
    ]

    for (const { collection: collectionName, indexes } of indexOperations) {
      const collection = this.db.collection(collectionName)
      
      for (const { spec, options } of indexes) {
        try {
          await collection.createIndex(spec, { background: true, ...options })
          console.log(`Created index ${options.name} on ${collectionName}`)
        } catch (error) {
          if (error.code === 85) {
            // Index already exists, skip
            console.log(`Index ${options.name} already exists on ${collectionName}`)
          } else {
            throw error
          }
        }
      }
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    // Migration 1: Create master data structure
    await MigrationUtils.runMigration('create_master_data_structure', async (db, session) => {
      const masterDataCollection = db.collection('masterData')
      
      for (const [type, values] of Object.entries(MASTER_DATA_DEFINITIONS)) {
        await masterDataCollection.updateOne(
          { type },
          { 
            $set: {
              type,
              values,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true, session }
        )
      }
    })

    // Migration 2: Add verification fields to existing assets
    await MigrationUtils.runMigration('add_asset_verification_fields', async (db, session) => {
      const assetsCollection = db.collection('assets')
      
      await assetsCollection.updateMany(
        { verificationStatus: { $exists: false } },
        { 
          $set: { 
            verificationStatus: 'Pending',
            lastVerificationDate: null,
            verificationNotes: '',
            verificationPhotos: []
          } 
        },
        { session }
      )
    })

    // Migration 3: Create workflow templates
    await MigrationUtils.runMigration('create_workflow_templates', async (db, session) => {
      const templatesCollection = db.collection('workflowTemplates')
      
      const templates = [
        {
          type: 'ASSET_TRANSFER',
          name: 'Asset Transfer Workflow',
          description: 'Standard workflow for transferring assets between locations or departments',
          steps: [
            {
              id: 'request',
              name: 'Transfer Request',
              assigneeRole: 'requester',
              actions: ['submit', 'cancel']
            },
            {
              id: 'spoc_approval',
              name: 'SPOC Approval',
              assigneeRole: 'spoc',
              actions: ['approve', 'reject', 'request_changes']
            },
            {
              id: 'admin_approval',
              name: 'Admin Approval',
              assigneeRole: 'admin',
              actions: ['approve', 'reject']
            },
            {
              id: 'execution',
              name: 'Execute Transfer',
              assigneeRole: 'admin',
              actions: ['complete', 'fail']
            }
          ],
          isActive: true
        }
      ]

      for (const template of templates) {
        await templatesCollection.updateOne(
          { type: template.type },
          { 
            $set: {
              ...template,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true, session }
        )
      }
    })
  }

  /**
   * Create master data
   */
  private async createMasterData(): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    const masterDataCollection = this.db.collection('masterData')
    
    for (const [type, values] of Object.entries(MASTER_DATA_DEFINITIONS)) {
      const existingData = await masterDataCollection.findOne({ type })
      
      if (!existingData) {
        await masterDataCollection.insertOne({
          type,
          values,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        console.log(`Created master data for ${type}`)
      } else {
        console.log(`Master data for ${type} already exists`)
      }
    }
  }

  /**
   * Create admin user
   */
  private async createAdminUser(): Promise<void> {
    const adminUser = SAMPLE_USERS.find(user => user.role === 'admin')
    if (!adminUser) throw new Error('Admin user not found in sample data')

    const existingAdmin = await userService.findByEmail(adminUser.email)
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminUser.password, 10)
      
      await userService.createUser({
        name: adminUser.name,
        email: adminUser.email,
        password: hashedPassword,
        role: adminUser.role,
        department: adminUser.department,
        isActive: adminUser.isActive
      })
      
      console.log(`Created admin user: ${adminUser.email}`)
    } else {
      console.log('Admin user already exists')
    }
  }

  /**
   * Create sample users
   */
  private async createSampleUsers(): Promise<void> {
    for (const userData of SAMPLE_USERS) {
      const existingUser = await userService.findByEmail(userData.email)
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        
        await userService.createUser({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          department: userData.department,
          isActive: userData.isActive
        })
        
        console.log(`Created sample user: ${userData.email}`)
      } else {
        console.log(`Sample user ${userData.email} already exists`)
      }
    }
  }

  /**
   * Create sample assets
   */
  private async createSampleAssets(): Promise<void> {
    const adminUser = await userService.findByEmail('admin@kti.com')
    if (!adminUser) throw new Error('Admin user not found')

    for (const assetData of SAMPLE_ASSETS) {
      try {
        await assetService.createAsset(assetData, adminUser._id.toString())
        console.log(`Created sample asset: ${assetData.assetDescription}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Sample asset already exists: ${assetData.assetDescription}`)
        } else {
          throw error
        }
      }
    }
  }

  /**
   * Validate database setup
   */
  private async validateSetup(): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    const validations = [
      {
        name: 'Master Data',
        check: async () => {
          const masterDataCollection = this.db!.collection('masterData')
          const count = await masterDataCollection.countDocuments()
          if (count === 0) throw new Error('No master data found')
          return `${count} master data types created`
        }
      },
      {
        name: 'Admin User',
        check: async () => {
          const adminUser = await userService.findByEmail('admin@kti.com')
          if (!adminUser) throw new Error('Admin user not found')
          return 'Admin user exists'
        }
      },
      {
        name: 'Database Indexes',
        check: async () => {
          const assetsCollection = this.db!.collection('assets')
          const indexes = await assetsCollection.listIndexes().toArray()
          if (indexes.length < 5) throw new Error('Insufficient indexes created')
          return `${indexes.length} indexes created`
        }
      },
      {
        name: 'Collections',
        check: async () => {
          const collections = await this.db!.listCollections().toArray()
          const requiredCollections = ['assets', 'users', 'masterData', 'migrations']
          const existingNames = collections.map(c => c.name)
          
          for (const required of requiredCollections) {
            if (!existingNames.includes(required)) {
              throw new Error(`Required collection ${required} not found`)
            }
          }
          
          return `${collections.length} collections available`
        }
      }
    ]

    for (const validation of validations) {
      try {
        const result = await validation.check()
        console.log(`✓ ${validation.name}: ${result}`)
      } catch (error) {
        console.error(`✗ ${validation.name}: ${error.message}`)
        throw new Error(`Validation failed for ${validation.name}: ${error.message}`)
      }
    }
  }

  /**
   * Reset database (for development/testing)
   */
  async resetDatabase(): Promise<void> {
    if (!this.db) {
      this.db = await this.connection.connect()
    }

    console.log('WARNING: Resetting database - all data will be lost!')
    
    const collections = ['assets', 'users', 'workflows', 'assetMovements', 'masterData', 'migrations']
    
    for (const collectionName of collections) {
      try {
        await this.db.collection(collectionName).drop()
        console.log(`Dropped collection: ${collectionName}`)
      } catch (error) {
        if (error.code === 26) {
          // Collection doesn't exist, ignore
          console.log(`Collection ${collectionName} doesn't exist`)
        } else {
          throw error
        }
      }
    }
    
    console.log('Database reset completed')
  }

  /**
   * Get initialization status
   */
  async getInitializationStatus(): Promise<{
    isInitialized: boolean
    details: Record<string, any>
  }> {
    try {
      if (!this.db) {
        this.db = await this.connection.connect()
      }

      const status = {
        isInitialized: false,
        details: {
          masterData: false,
          adminUser: false,
          indexes: false,
          migrations: false
        }
      }

      // Check master data
      const masterDataCount = await this.db.collection('masterData').countDocuments()
      status.details.masterData = masterDataCount > 0

      // Check admin user
      const adminUser = await userService.findByEmail('admin@kti.com')
      status.details.adminUser = !!adminUser

      // Check indexes
      const assetsCollection = this.db.collection('assets')
      const indexes = await assetsCollection.listIndexes().toArray()
      status.details.indexes = indexes.length > 3

      // Check migrations
      const migrationsCount = await this.db.collection('migrations').countDocuments()
      status.details.migrations = migrationsCount > 0

      status.isInitialized = Object.values(status.details).every(Boolean)

      return status
    } catch (error) {
      return {
        isInitialized: false,
        details: { error: error.message }
      }
    }
  }
}

// Export singleton instance
export const databaseInitializer = new DatabaseInitializer()