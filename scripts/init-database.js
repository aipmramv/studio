#!/usr/bin/env node

/**
 * Database initialization script (JavaScript version)
 * Run this script to set up the MongoDB database with proper indexes and initial data
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'kti_assets';

// Enhanced connection options for remote servers
const CONNECTION_OPTIONS = {
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
  maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'),
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '10000'),
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
  connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '15000'),
  heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY || '10000'),
  retryWrites: true,
  retryReads: true,
  // SSL/TLS options for Atlas and secure connections
  ssl: MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('ssl=true'),
  tls: MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('tls=true'),
};

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
};

async function createIndexes(db) {
  console.log('Creating database indexes...');
  
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
  ];

  for (const { collection: collectionName, indexes } of indexOperations) {
    const collection = db.collection(collectionName);
    
    for (const { spec, options } of indexes) {
      try {
        await collection.createIndex(spec, { background: true, ...options });
        console.log(`✓ Created index ${options.name} on ${collectionName}`);
      } catch (error) {
        if (error.code === 85) {
          // Index already exists, skip
          console.log(`✓ Index ${options.name} already exists on ${collectionName}`);
        } else {
          throw error;
        }
      }
    }
  }
}

async function createMasterData(db) {
  console.log('Creating master data...');
  
  const masterDataCollection = db.collection('masterData');
  
  for (const [type, values] of Object.entries(MASTER_DATA_DEFINITIONS)) {
    const existingData = await masterDataCollection.findOne({ type });
    
    if (!existingData) {
      await masterDataCollection.insertOne({
        type,
        values,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✓ Created master data for ${type}`);
    } else {
      console.log(`✓ Master data for ${type} already exists`);
    }
  }
}

async function createAdminUser(db) {
  console.log('Creating admin user...');
  
  const usersCollection = db.collection('users');
  const adminEmail = 'admin@kti.com';
  
  const existingAdmin = await usersCollection.findOne({ email: adminEmail });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await usersCollection.insertOne({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      department: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✓ Created admin user: ${adminEmail}`);
  } else {
    console.log('✓ Admin user already exists');
  }
}

async function validateSetup(db) {
  console.log('Validating database setup...');
  
  // Check master data
  const masterDataCollection = db.collection('masterData');
  const masterDataCount = await masterDataCollection.countDocuments();
  if (masterDataCount === 0) {
    throw new Error('No master data found');
  }
  console.log(`✓ Master data: ${masterDataCount} types created`);
  
  // Check admin user
  const usersCollection = db.collection('users');
  const adminUser = await usersCollection.findOne({ email: 'admin@kti.com' });
  if (!adminUser) {
    throw new Error('Admin user not found');
  }
  console.log('✓ Admin user exists');
  
  // Check indexes
  const assetsCollection = db.collection('assets');
  const indexes = await assetsCollection.listIndexes().toArray();
  if (indexes.length < 5) {
    throw new Error('Insufficient indexes created');
  }
  console.log(`✓ Database indexes: ${indexes.length} indexes created`);
  
  // Check collections
  const collections = await db.listCollections().toArray();
  const requiredCollections = ['assets', 'users', 'masterData'];
  const existingNames = collections.map(c => c.name);
  
  for (const required of requiredCollections) {
    if (!existingNames.includes(required)) {
      throw new Error(`Required collection ${required} not found`);
    }
  }
  console.log(`✓ Collections: ${collections.length} collections available`);
}

async function main() {
  const client = new MongoClient(MONGODB_URI, CONNECTION_OPTIONS);
  
  try {
    console.log('🚀 Starting database initialization...');
    console.log(`📍 MongoDB URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.log(`📍 Database: ${DATABASE_NAME}`);
    console.log(`📍 Connection Type: ${MONGODB_URI.includes('mongodb+srv://') ? 'MongoDB Atlas' : 'MongoDB Server'}`);
    
    // Connect to MongoDB
    console.log('⏳ Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    
    // Test connection
    await db.admin().ping();
    console.log('✓ Database connection verified');
    
    // Create indexes
    await createIndexes(db);
    
    // Create master data
    await createMasterData(db);
    
    // Create admin user
    await createAdminUser(db);
    
    // Validate setup
    await validateSetup(db);
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Database indexes created');
    console.log('   • Master data populated');
    console.log('   • Admin user created (admin@kti.com / admin123)');
    console.log('   • Setup validation passed');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };