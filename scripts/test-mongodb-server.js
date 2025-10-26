#!/usr/bin/env node

/**
 * Simple MongoDB Server Connection Test
 * Tests connection to remote MongoDB server or Atlas
 */

const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testMongoDBConnection() {
  // Get connection details from environment or command line
  const uri = process.argv[2] || process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGO_URI;
  const dbName = process.argv[3] || process.env.MONGODB_DATABASE || process.env.NEXT_PUBLIC_MONGO_DB || 'kti_assets';
  
  if (!uri) {
    console.error('❌ No MongoDB URI provided');
    console.log('\n📋 Usage:');
    console.log('   node test-mongodb-server.js <connection-uri> [database-name]');
    console.log('\n📋 Examples:');
    console.log('   # Test Atlas connection');
    console.log('   node test-mongodb-server.js "mongodb+srv://user:pass@cluster0.mongodb.net/kti_assets"');
    console.log('\n   # Test from environment');
    console.log('   node test-mongodb-server.js');
    process.exit(1);
  }
  
  console.log('🔍 Testing MongoDB Connection');
  console.log('=' .repeat(50));
  console.log(`📍 URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`📍 Database: ${dbName}`);
  console.log(`📍 Type: ${uri.includes('mongodb+srv://') ? 'MongoDB Atlas' : 'MongoDB Server'}`);
  console.log('');
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    retryWrites: true,
    retryReads: true,
  });
  
  try {
    console.log('⏳ Connecting...');
    const startTime = Date.now();
    
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully (${connectTime}ms)`);
    
    // Test database access
    console.log('⏳ Testing database access...');
    const db = client.db(dbName);
    const pingResult = await db.admin().ping();
    console.log('✅ Database ping successful:', pingResult);
    
    // List databases
    console.log('⏳ Listing databases...');
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log(`✅ Found ${databases.databases.length} databases:`, 
      databases.databases.map(db => db.name).join(', '));
    
    // Check target database
    const targetDb = databases.databases.find(db => db.name === dbName);
    if (targetDb) {
      console.log(`✅ Target database '${dbName}' exists (${(targetDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // List collections
      const collections = await db.listCollections().toArray();
      if (collections.length > 0) {
        console.log(`✅ Found ${collections.length} collections:`, 
          collections.map(c => c.name).join(', '));
        
        // Count documents in each collection
        for (const collection of collections) {
          const count = await db.collection(collection.name).countDocuments();
          console.log(`   📊 ${collection.name}: ${count} documents`);
        }
      } else {
        console.log('ℹ️  Database exists but has no collections');
      }
    } else {
      console.log(`ℹ️  Target database '${dbName}' doesn't exist yet (will be created on first write)`);
    }
    
    // Test write operation
    console.log('⏳ Testing write operation...');
    const testCollection = db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Write test successful, document ID:', insertResult.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 All tests passed! MongoDB connection is working correctly.');
    
    return {
      success: true,
      connectionTime: connectTime,
      databases: databases.databases.length,
      collections: collections?.length || 0
    };
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Error Solutions:');
      console.log('   • Verify username and password in connection string');
      console.log('   • Check database user permissions in MongoDB Atlas');
      console.log('   • Ensure user has read/write access to the database');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('\n💡 Network Error Solutions:');
      console.log('   • Check internet connection');
      console.log('   • Verify IP address is whitelisted (MongoDB Atlas)');
      console.log('   • Check firewall settings');
      console.log('   • Try increasing timeout values');
    } else if (error.message.includes('parse')) {
      console.log('\n💡 Connection String Error Solutions:');
      console.log('   • Verify connection string format');
      console.log('   • Check for special characters in password (URL encode them)');
      console.log('   • Ensure proper protocol (mongodb:// or mongodb+srv://)');
    }
    
    return { success: false, error: error.message };
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

// Run the test
if (require.main === module) {
  testMongoDBConnection()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testMongoDBConnection };