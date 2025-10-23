const { MongoClient } = require('mongodb');
const { hash } = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.NEXT_PUBLIC_MONGO_URI;
const dbName = process.env.NEXT_PUBLIC_MONGO_DB;

if (!uri || !dbName) {
  console.error('Please set NEXT_PUBLIC_MONGO_URI and NEXT_PUBLIC_MONGO_DB environment variables');
  process.exit(1);
}

async function createAdminUser() {
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  
  try {
    const users = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await users.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await hash('admin123', 12);
    const result = await users.insertOne({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Default Admin',
      role: 'admin',
      department: 'IT',
      displayName: 'Default Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (result.acknowledged) {
      console.log('Admin user created successfully');
    } else {
      console.error('Failed to create admin user');
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdminUser();