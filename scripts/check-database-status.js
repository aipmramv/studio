#!/usr/bin/env node

/**
 * Database status check script
 * Verifies MongoDB connection, database setup, and collection status
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'kti_assets';

// Enhanced connection options for remote servers
const CONNECTION_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  retryWrites: true,
  retryReads: true,
  ssl: MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('ssl=true'),
  tls: MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('tls=true'),
};

async function checkDatabaseStatus() {
  const client = new MongoClient(MONGODB_URI, CONNECTION_OPTIONS);
  
  try {
    console.log('🔍 Checking database status...');
    console.log(`📍 MongoDB URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.log(`📍 Database: ${DATABASE_NAME}`);
    console.log(`📍 Connection Type: ${MONGODB_URI.includes('mongodb+srv://') ? 'MongoDB Atlas' : 'MongoDB Server'}`);
    
    // Connect to MongoDB
    console.log('⏳ Connecting to MongoDB...');
    await client.connect();
    console.log('✓ MongoDB connection successful');
    
    const db = client.db(DATABASE_NAME);
    
    // Test connection with ping
    const pingResult = await db.admin().ping();
    console.log('✓ Database ping successful:', pingResult);
    
    // Get database stats
    const dbStats = await db.stats();
    console.log('\n📊 Database Statistics:');
    console.log(`   • Collections: ${dbStats.collections}`);
    console.log(`   • Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   • Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   • Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections:');
    
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const count = await coll.countDocuments();
      const indexes = await coll.listIndexes().toArray();
      
      console.log(`   • ${collection.name}: ${count} documents, ${indexes.length} indexes`);
    }
    
    // Check master data
    console.log('\n🗂️  Master Data Status:');
    const masterDataCollection = db.collection('masterData');
    const masterDataTypes = await masterDataCollection.find({}).toArray();
    
    for (const masterData of masterDataTypes) {
      console.log(`   • ${masterData.type}: ${masterData.values.length} entries`);
    }
    
    // Check admin user
    console.log('\n👤 Admin User Status:');
    const usersCollection = db.collection('users');
    const adminUser = await usersCollection.findOne({ email: 'admin@kti.com' });
    
    if (adminUser) {
      console.log('   ✓ Admin user exists');
      console.log(`   • Name: ${adminUser.name}`);
      console.log(`   • Email: ${adminUser.email}`);
      console.log(`   • Role: ${adminUser.role}`);
      console.log(`   • Department: ${adminUser.department}`);
      console.log(`   • Active: ${adminUser.isActive}`);
    } else {
      console.log('   ❌ Admin user not found');
    }
    
    // Check sample assets (if any)
    console.log('\n📦 Assets Status:');
    const assetsCollection = db.collection('assets');
    const assetCount = await assetsCollection.countDocuments();
    console.log(`   • Total assets: ${assetCount}`);
    
    if (assetCount > 0) {
      const sampleAsset = await assetsCollection.findOne({});
      console.log(`   • Sample asset: ${sampleAsset.assetDescription || 'N/A'}`);
    }
    
    // Check workflows
    console.log('\n🔄 Workflows Status:');
    const workflowsCollection = db.collection('workflows');
    const workflowCount = await workflowsCollection.countDocuments();
    console.log(`   • Total workflows: ${workflowCount}`);
    
    // Check indexes for critical collections
    console.log('\n🔍 Index Status:');
    const criticalCollections = ['assets', 'users', 'workflows', 'masterData'];
    
    for (const collectionName of criticalCollections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`   • ${collectionName}: ${indexes.length} indexes`);
      
      // List index names
      const indexNames = indexes.map(idx => idx.name).join(', ');
      console.log(`     Indexes: ${indexNames}`);
    }
    
    console.log('\n🎉 Database status check completed successfully!');
    
    return {
      status: 'healthy',
      details: {
        connected: true,
        collections: collections.length,
        masterDataTypes: masterDataTypes.length,
        adminUserExists: !!adminUser,
        totalAssets: assetCount,
        totalWorkflows: workflowCount
      }
    };
    
  } catch (error) {
    console.error('\n❌ Database status check failed:', error.message);
    return {
      status: 'error',
      error: error.message
    };
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  checkDatabaseStatus()
    .then(result => {
      if (result.status === 'error') {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStatus };