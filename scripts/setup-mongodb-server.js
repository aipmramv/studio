#!/usr/bin/env node

/**
 * MongoDB Server Setup Script
 * Helps configure connection to MongoDB Atlas or remote MongoDB server
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Common MongoDB Atlas connection string patterns
const ATLAS_PATTERNS = {
  standard: 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority',
  withOptions: 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=KTI-Assets'
};

// Common MongoDB server connection patterns
const SERVER_PATTERNS = {
  standard: 'mongodb://<username>:<password>@<host>:<port>/<database>',
  replica: 'mongodb://<username>:<password>@<host1>:<port1>,<host2>:<port2>,<host3>:<port3>/<database>?replicaSet=<replicaSetName>',
  ssl: 'mongodb://<username>:<password>@<host>:<port>/<database>?ssl=true&authSource=admin'
};

function displayConnectionPatterns() {
  console.log('🔗 MongoDB Connection String Patterns:\n');
  
  console.log('📊 MongoDB Atlas:');
  Object.entries(ATLAS_PATTERNS).forEach(([name, pattern]) => {
    console.log(`   ${name}: ${pattern}`);
  });
  
  console.log('\n🖥️  MongoDB Server:');
  Object.entries(SERVER_PATTERNS).forEach(([name, pattern]) => {
    console.log(`   ${name}: ${pattern}`);
  });
  
  console.log('\n📝 Replace placeholders:');
  console.log('   <username>     - Your MongoDB username');
  console.log('   <password>     - Your MongoDB password');
  console.log('   <cluster>      - Your Atlas cluster name');
  console.log('   <host>         - Server hostname/IP');
  console.log('   <port>         - Server port (default: 27017)');
  console.log('   <database>     - Database name (kti_assets)');
}

async function testConnection(uri, dbName) {
  console.log('\n🔍 Testing MongoDB connection...');
  console.log(`📍 URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`📍 Database: ${dbName}`);
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  });
  
  try {
    await client.connect();
    console.log('✓ Connection successful');
    
    const db = client.db(dbName);
    const pingResult = await db.admin().ping();
    console.log('✓ Database ping successful:', pingResult);
    
    // List existing databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('✓ Available databases:', dbs.databases.map(db => db.name).join(', '));
    
    // Check if target database exists
    const targetExists = dbs.databases.some(db => db.name === dbName);
    if (targetExists) {
      console.log(`✓ Target database '${dbName}' exists`);
      
      // List collections in target database
      const collections = await db.listCollections().toArray();
      if (collections.length > 0) {
        console.log('✓ Existing collections:', collections.map(c => c.name).join(', '));
      } else {
        console.log('ℹ️  Database exists but has no collections yet');
      }
    } else {
      console.log(`ℹ️  Target database '${dbName}' will be created on first write`);
    }
    
    return { success: true, details: { databases: dbs.databases.length, collections: collections?.length || 0 } };
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Tips:');
      console.log('   • Check username and password');
      console.log('   • Ensure user has proper database permissions');
      console.log('   • For Atlas: Check database user in Atlas dashboard');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Network Tips:');
      console.log('   • Check internet connection');
      console.log('   • For Atlas: Check IP whitelist in Atlas dashboard');
      console.log('   • Verify firewall settings');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout Tips:');
      console.log('   • Server may be slow or overloaded');
      console.log('   • Check connection string format');
      console.log('   • Try increasing timeout values');
    }
    
    return { success: false, error: error.message };
  } finally {
    await client.close();
  }
}

function updateEnvFile(uri, dbName) {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add MongoDB configuration
  const mongoConfig = `# MongoDB Configuration - Remote Server
MONGODB_URI=${uri}
MONGODB_DATABASE=${dbName}

# Next.js MongoDB Configuration (for client-side access if needed)
NEXT_PUBLIC_MONGO_URI=${uri}
NEXT_PUBLIC_MONGO_DB=${dbName}`;
  
  // Replace existing MongoDB config or add new one
  if (envContent.includes('MONGODB_URI=')) {
    envContent = envContent.replace(
      /# MongoDB Configuration.*?\n(NEXT_PUBLIC_MONGO_DB=.*?\n)/s,
      mongoConfig + '\n\n'
    );
  } else {
    envContent = mongoConfig + '\n\n' + envContent;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✓ Updated ${envPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🚀 MongoDB Server Setup\n');
    displayConnectionPatterns();
    console.log('\n📋 Usage:');
    console.log('   node setup-mongodb-server.js <connection-uri> [database-name]');
    console.log('\n📋 Examples:');
    console.log('   # MongoDB Atlas');
    console.log('   node setup-mongodb-server.js "mongodb+srv://user:pass@cluster0.mongodb.net/kti_assets"');
    console.log('\n   # MongoDB Server');
    console.log('   node setup-mongodb-server.js "mongodb://user:pass@server.com:27017/kti_assets"');
    console.log('\n   # Test existing configuration');
    console.log('   node setup-mongodb-server.js --test');
    return;
  }
  
  if (args[0] === '--test') {
    // Test existing configuration
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
      console.error('❌ No .env.local file found');
      process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const uriMatch = envContent.match(/MONGODB_URI=(.+)/);
    const dbMatch = envContent.match(/MONGODB_DATABASE=(.+)/);
    
    if (!uriMatch) {
      console.error('❌ No MONGODB_URI found in .env.local');
      process.exit(1);
    }
    
    const uri = uriMatch[1].trim();
    const dbName = dbMatch ? dbMatch[1].trim() : 'kti_assets';
    
    const result = await testConnection(uri, dbName);
    process.exit(result.success ? 0 : 1);
  }
  
  const uri = args[0];
  const dbName = args[1] || 'kti_assets';
  
  // Test the connection
  const result = await testConnection(uri, dbName);
  
  if (result.success) {
    // Update .env.local file
    updateEnvFile(uri, dbName);
    
    console.log('\n🎉 MongoDB server setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: node scripts/init-database.js');
    console.log('   2. Start your Next.js application: npm run dev');
    console.log('   3. Visit: http://localhost:3000/database-test');
  } else {
    console.log('\n❌ Setup failed. Please check your connection string and try again.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testConnection, updateEnvFile };