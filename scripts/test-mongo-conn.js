// Simple script to test MongoDB connectivity using NEXT_PUBLIC_MONGO_URI and NEXT_PUBLIC_MONGO_DB
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.NEXT_PUBLIC_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.NEXT_PUBLIC_MONGO_DB || process.env.MONGO_DB || 'test';
  console.log('Using URI:', uri);
  console.log('Database:', dbName);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const admin = client.db(dbName).admin();
    const info = await admin.ping();
    console.log('Ping reply:', info);
    console.log('Connected to MongoDB successfully');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message || err);
    process.exit(2);
  }
}

main();
