// Load .env.local (if present) and test Mongo connection with TLS options
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...rest] = trimmed.split('=');
    const v = rest.join('=');
    process.env[k.trim()] = v.trim();
  }
}

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  loadEnvFile(envPath);

  const uri = process.env.NEXT_PUBLIC_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.NEXT_PUBLIC_MONGO_DB || process.env.MONGO_DB || 'test';

  console.log('Attempting MongoDB Atlas connection...');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    ssl: true,
    tlsAllowInvalidCertificates: true,
    directConnection: false
  });

  try {
    await client.connect();
    const admin = client.db(dbName).admin();
    const info = await admin.ping();
    console.log('Ping reply:', info);
    console.log('Connected to MongoDB Atlas successfully');

    // Try listing databases as additional connection test
    const dbs = await admin.listDatabases();
    console.log('\nAvailable databases:', dbs.databases.map(db => db.name).join(', '));
    
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('\nMongoDB connection failed:', err.message || err);
    if (err.code) console.error('Error code:', err.code);
    process.exit(2);
  }
}

main();