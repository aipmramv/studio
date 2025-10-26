/**
 * MongoDB Client Wrapper for Next.js
 * This ensures MongoDB operations only happen on the server side
 */

import { MongoDBConnection } from './mongodb-service';

// Server-side only MongoDB operations
export class MongoDBClient {
  private static instance: MongoDBClient;
  private connection: MongoDBConnection | null = null;

  private constructor() {
    // Only initialize on server side
    if (typeof window === 'undefined') {
      this.connection = MongoDBConnection.getInstance();
    }
  }

  public static getInstance(): MongoDBClient {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }

  public async getConnection() {
    if (typeof window !== 'undefined') {
      throw new Error('MongoDB operations are only available on the server side');
    }
    
    if (!this.connection) {
      throw new Error('MongoDB connection not initialized');
    }
    
    return await this.connection.connect();
  }

  public async healthCheck() {
    if (typeof window !== 'undefined') {
      throw new Error('MongoDB operations are only available on the server side');
    }
    
    if (!this.connection) {
      throw new Error('MongoDB connection not initialized');
    }
    
    return await this.connection.healthCheck();
  }

  public isServerSide(): boolean {
    return typeof window === 'undefined';
  }
}

// Export a singleton instance
export const mongoClient = MongoDBClient.getInstance();