import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { config } from './config.js';
import { logger } from './logger.js';

let mongoClient: MongoClient | null = null;
export let db: Db | null = null;

const mongoOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 120000,
  retryWrites: false, // Required for Cosmos DB
  serverSelectionTimeoutMS: 5000,
};

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    logger.info('Connecting to database...', { uri: config.mongoUri.substring(0, 50) + '...' });

    mongoClient = new MongoClient(config.mongoUri, mongoOptions);
    await mongoClient.connect();

    db = mongoClient.db(config.mongoDatabase);

    // Verify connection
    const adminDb = mongoClient.db('admin');
    await adminDb.command({ ping: 1 });

    logger.info('Database connection established successfully');
    return db;
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    logger.info('Database connection closed');
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export async function ensureIndexes(): Promise<void> {
  const database = getDatabase();

  try {
    // Assets collection indexes
    const assetsCollection = database.collection('assets');
    await assetsCollection.createIndex({ assetNumber: 1 }, { unique: true });
    await assetsCollection.createIndex({ department: 1 });
    await assetsCollection.createIndex({ location: 1 });
    await assetsCollection.createIndex({ currentStatus: 1 });
    await assetsCollection.createIndex({ createdAt: 1 });

    // Users collection indexes
    const usersCollection = database.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ department: 1 });

    // Workflows collection indexes
    const workflowsCollection = database.collection('workflows');
    await workflowsCollection.createIndex({ assetId: 1 });
    await workflowsCollection.createIndex({ status: 1 });
    await workflowsCollection.createIndex({ createdAt: 1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create indexes', error);
    throw error;
  }
}
