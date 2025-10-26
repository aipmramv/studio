import 'server-only'

import { MongoDBConnection, userService, assetService } from './mongodb-service';
import { hash } from 'bcryptjs';
import { DEPARTMENTS, ASSET_CLASSIFICATIONS, ASSET_STATUSES, STORE_LOCATIONS, TEAMS_AND_TRIBES } from './constants';

// Master data initialization
export async function initializeMasterData(): Promise<void> {
  const db = MongoDBConnection.getInstance().getDb();
  
  // Initialize master data collections
  const masterDataCollections = [
    { name: 'departments', data: DEPARTMENTS.map(dept => ({ name: dept, isActive: true })) },
    { name: 'assetClassifications', data: ASSET_CLASSIFICATIONS.map(cls => ({ name: cls, isActive: true })) },
    { name: 'assetStatuses', data: ASSET_STATUSES.map(status => ({ name: status, isActive: true })) },
    { name: 'storeLocations', data: STORE_LOCATIONS.map(loc => ({ name: loc, isActive: true })) },
    { name: 'teamsAndTribes', data: TEAMS_AND_TRIBES.map(team => ({ name: team, isActive: true })) },
  ];

  for (const masterData of masterDataCollections) {
    const collection = db.collection(masterData.name);
    
    // Check if data already exists
    const existingCount = await collection.countDocuments();
    if (existingCount === 0) {
      const documents = masterData.data.map(item => ({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      await collection.insertMany(documents);
      console.log(`Initialized ${masterData.name} with ${documents.length} items`);
    }
  }
}

// Create default admin user
export async function createDefaultAdmin(): Promise<void> {
  try {
    // Check if admin user already exists
    const existingAdmin = await userService.findByEmail('admin@kti.com');
    if (existingAdmin) {
      console.log('Default admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await hash('admin123', 12);
    
    await userService.createUser({
      email: 'admin@kti.com',
      name: 'System Administrator',
      role: 'admin',
      password: hashedPassword,
      department: 'IT',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Default admin user created successfully');
    console.log('Email: admin@kti.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating default admin user:', error);
    throw error;
  }
}

// Create sample users for testing
export async function createSampleUsers(): Promise<void> {
  const sampleUsers = [
    {
      email: 'spoc.rd@kti.com',
      name: 'R&D SPOC',
      role: 'spoc' as const,
      department: 'R&D',
      password: 'spoc123',
    },
    {
      email: 'spoc.production@kti.com',
      name: 'Production SPOC',
      role: 'spoc' as const,
      department: 'Production',
      password: 'spoc123',
    },
    {
      email: 'user.rd@kti.com',
      name: 'R&D User',
      role: 'user' as const,
      department: 'R&D',
      password: 'user123',
    },
    {
      email: 'user.production@kti.com',
      name: 'Production User',
      role: 'user' as const,
      department: 'Production',
      password: 'user123',
    },
  ];

  for (const userData of sampleUsers) {
    try {
      const existingUser = await userService.findByEmail(userData.email);
      if (!existingUser) {
        const hashedPassword = await hash(userData.password, 12);
        
        await userService.createUser({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          department: userData.department,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`Created sample user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
}

// Create sample assets for testing
export async function createSampleAssets(): Promise<void> {
  const sampleAssets = [
    {
      assetNumber: 'KTI-2024-0001',
      assetDescription: 'Dell Laptop Precision 5570',
      assetClassification: 'IT Equipment' as const,
      department: 'R&D' as const,
      location: 'ITEC' as const,
      currentStatus: 'In Use' as const,
      purchaseValue: 150000,
      brandName: 'Dell',
      modelNo: 'Precision 5570',
      productSerialNo: 'DL123456789',
      ledgerQty: 1,
      verificationStatus: 'Verified' as const,
      usableCondition: 'Yes' as const,
      workingConditionStatus: 'Working' as const,
    },
    {
      assetNumber: 'KTI-2024-0002',
      assetDescription: 'Tektronix Oscilloscope',
      assetClassification: 'Test Equipment' as const,
      department: 'R&D' as const,
      location: 'ITEC' as const,
      currentStatus: 'In Store' as const,
      purchaseValue: 500000,
      brandName: 'Tektronix',
      modelNo: 'MSO64',
      productSerialNo: 'TEK987654321',
      ledgerQty: 1,
      verificationStatus: 'Pending' as const,
      usableCondition: 'Yes' as const,
      workingConditionStatus: 'Working' as const,
    },
    {
      assetNumber: 'KTI-2024-0003',
      assetDescription: 'Industrial Drill Machine',
      assetClassification: 'Tools & Tackles' as const,
      department: 'Production' as const,
      location: 'Production Line A' as const,
      currentStatus: 'In Use' as const,
      purchaseValue: 25000,
      brandName: 'Bosch',
      modelNo: 'GSB 550',
      productSerialNo: 'BSH456789123',
      ledgerQty: 1,
      verificationStatus: 'Verified' as const,
      usableCondition: 'Yes' as const,
      workingConditionStatus: 'Working' as const,
    },
    {
      assetNumber: 'KTI-2024-0004',
      assetDescription: 'Conference Room Projector',
      assetClassification: 'IT Equipment' as const,
      department: 'IT' as const,
      location: 'Central Warehouse Alpha' as const,
      currentStatus: 'Under Maintenance' as const,
      purchaseValue: 75000,
      brandName: 'Epson',
      modelNo: 'EB-2250U',
      productSerialNo: 'EPS789123456',
      ledgerQty: 1,
      verificationStatus: 'Discrepancy' as const,
      usableCondition: 'Partial' as const,
      workingConditionStatus: 'Under Maintenance' as const,
    },
    {
      assetNumber: 'KTI-2024-0005',
      assetDescription: 'Office Chair Executive',
      assetClassification: 'Furniture & Fixtures' as const,
      department: 'HR' as const,
      location: 'Central Warehouse Alpha' as const,
      currentStatus: 'In Store' as const,
      purchaseValue: 15000,
      brandName: 'Steelcase',
      modelNo: 'Leap V2',
      productSerialNo: 'SC123789456',
      ledgerQty: 1,
      verificationStatus: 'Verified' as const,
      usableCondition: 'Yes' as const,
      workingConditionStatus: 'Working' as const,
    },
  ];

  for (const assetData of sampleAssets) {
    try {
      // Check if asset already exists
      const existingAssets = await assetService.searchAssets({ 
        searchTerm: assetData.assetNumber 
      });
      
      if (existingAssets.assets.length === 0) {
        await assetService.createAsset(assetData, 'system');
        console.log(`Created sample asset: ${assetData.assetNumber}`);
      }
    } catch (error) {
      console.error(`Error creating asset ${assetData.assetNumber}:`, error);
    }
  }
}

// Create workflow templates
export async function createWorkflowTemplates(): Promise<void> {
  const db = MongoDBConnection.getInstance().getDb();
  const collection = db.collection('workflowTemplates');

  const workflowTemplates = [
    {
      id: 'asset_request_default',
      name: 'Default Asset Request',
      requestType: 'Asset Request',
      steps: [
        {
          id: 'admin_approval',
          name: 'Admin Approval',
          assignedRoles: ['admin'],
          nextStepId: 'request_closed',
        },
        {
          id: 'request_closed',
          name: 'Request Closed',
          assignedRoles: [],
        },
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'material_movement_default',
      name: 'Default Material Movement',
      requestType: 'Material Movement',
      steps: [
        {
          id: 'mm_dept_head_approval',
          name: 'Department Head Approval',
          assignedRoles: ['admin', 'spoc'],
          nextStepId: 'mm_dispatch_team_coordination',
        },
        {
          id: 'mm_dispatch_team_coordination',
          name: 'Dispatch Team Coordination',
          assignedRoles: ['admin'],
          nextStepId: 'mm_finance_check',
        },
        {
          id: 'mm_finance_check',
          name: 'Finance Check (If Applicable)',
          assignedRoles: ['admin'],
          nextStepId: 'mm_receipt_confirmation',
        },
        {
          id: 'mm_receipt_confirmation',
          name: 'Receipt Confirmation',
          assignedRoles: ['admin'],
        },
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const template of workflowTemplates) {
    const existing = await collection.findOne({ id: template.id });
    if (!existing) {
      await collection.insertOne(template);
      console.log(`Created workflow template: ${template.name}`);
    }
  }
}

// Main initialization function
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Starting database initialization...');
    
    // Connect to database
    const connection = MongoDBConnection.getInstance();
    await connection.connect();
    
    // Initialize master data
    await initializeMasterData();
    
    // Create default users
    await createDefaultAdmin();
    await createSampleUsers();
    
    // Create sample assets
    await createSampleAssets();
    
    // Create workflow templates
    await createWorkflowTemplates();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  collections: string[];
  userCount: number;
  assetCount: number;
}> {
  try {
    const db = MongoDBConnection.getInstance().getDb();
    
    // Test connection
    await db.admin().ping();
    
    // Get collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    // Get counts
    const userCount = await userService.count();
    const assetCount = await assetService.count();
    
    return {
      connected: true,
      collections: collectionNames,
      userCount,
      assetCount,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      connected: false,
      collections: [],
      userCount: 0,
      assetCount: 0,
    };
  }
}

// Migration utilities
export async function runMigrations(): Promise<void> {
  const db = MongoDBConnection.getInstance().getDb();
  const migrationsCollection = db.collection('migrations');
  
  // Track which migrations have been run
  const migrations = [
    {
      version: '1.0.0',
      name: 'Initial setup',
      run: async () => {
        await initializeMasterData();
        await createDefaultAdmin();
      },
    },
    {
      version: '1.1.0',
      name: 'Add sample data',
      run: async () => {
        await createSampleUsers();
        await createSampleAssets();
        await createWorkflowTemplates();
      },
    },
  ];

  for (const migration of migrations) {
    const existing = await migrationsCollection.findOne({ version: migration.version });
    if (!existing) {
      console.log(`Running migration: ${migration.name} (${migration.version})`);
      
      try {
        await migration.run();
        
        await migrationsCollection.insertOne({
          version: migration.version,
          name: migration.name,
          runAt: new Date(),
        });
        
        console.log(`Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`Migration failed: ${migration.name}`, error);
        throw error;
      }
    }
  }
}