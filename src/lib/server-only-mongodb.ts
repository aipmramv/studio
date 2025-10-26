/**
 * Server-Only MongoDB Operations
 * This module ensures MongoDB operations only happen on the server side
 * and provides a clean API for client-side components to use
 */

import 'server-only';

// Only import MongoDB on server side
let MongoDBConnection: any = null;
let DatabaseUtils: any = null;

// Lazy load MongoDB modules only on server side
async function getMongoDBModules() {
  if (!MongoDBConnection || !DatabaseUtils) {
    const mongoModule = await import('./mongodb-service');
    MongoDBConnection = mongoModule.MongoDBConnection;
    DatabaseUtils = mongoModule.DatabaseUtils;
  }
  return { MongoDBConnection, DatabaseUtils };
}

export async function getServerDatabaseConnection() {
  const { MongoDBConnection } = await getMongoDBModules();
  const connection = MongoDBConnection.getInstance();
  return await connection.connect();
}

export async function getServerDatabaseHealth() {
  const { MongoDBConnection } = await getMongoDBModules();
  const connection = MongoDBConnection.getInstance();
  return await connection.healthCheck();
}

export async function getServerDatabaseStats() {
  const { DatabaseUtils } = await getMongoDBModules();
  return await DatabaseUtils.getDatabaseStats();
}

export async function checkServerCollectionHealth(collectionName: string) {
  const { DatabaseUtils } = await getMongoDBModules();
  return await DatabaseUtils.checkCollectionHealth(collectionName);
}

// Type definitions for client-side usage
export interface DatabaseHealthResponse {
  status: string;
  details: any;
}

export interface DatabaseStatsResponse {
  database: any;
  collections: Record<string, any>;
}

export interface CollectionHealthResponse {
  status: 'healthy' | 'warning' | 'error';
  details: any;
}