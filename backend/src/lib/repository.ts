import { getDatabase } from './database.js';
import { logger } from './logger.js';
import { ObjectId, Document } from 'mongodb';

/**
 * Base repository class for database operations
 */
export abstract class BaseRepository<T extends Document> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollection() {
    const database = getDatabase();
    return database.collection<T>(this.collectionName);
  }

  async findById(id: string): Promise<T | null> {
    try {
      const collection = this.getCollection();
      let query: any = { _id: id };

      // Try as ObjectId if it looks like one
      try {
        if (ObjectId.isValid(id)) {
          const objectId = new ObjectId(id);
          const doc = await collection.findOne({ _id: objectId } as any);
          if (doc) return doc as T;
        }
      } catch (err) {
        logger.debug('ObjectId conversion failed', err);
      }

      // Fall back to string query
      const result = await collection.findOne(query);
      return result as T | null;
    } catch (error) {
      logger.error(`Failed to find ${this.collectionName} by ID: ${id}`, error);
      throw error;
    }
  }

  async findAll(
    filter: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<T[]> {
    try {
      const collection = this.getCollection();
      let query = collection.find(filter);

      if (options.skip) query = query.skip(options.skip);
      if (options.limit) query = query.limit(options.limit);
      if (options.sort) query = query.sort(options.sort);

      const docs = await query.toArray();
      return docs as T[];
    } catch (error) {
      logger.error(`Failed to find all ${this.collectionName}`, error);
      throw error;
    }
  }

  async findOne(filter: any): Promise<T | null> {
    try {
      const collection = this.getCollection();
      const result = await collection.findOne(filter);
      return result as T | null;
    } catch (error) {
      logger.error(`Failed to find one ${this.collectionName}`, error);
      throw error;
    }
  }

  async create(data: Omit<T, '_id'>): Promise<T> {
    try {
      const collection = this.getCollection();
      const doc = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(doc as any);
      return { _id: result.insertedId, ...data } as unknown as T;
    } catch (error) {
      logger.error(`Failed to create ${this.collectionName}`, error);
      throw error;
    }
  }

  async updateById(id: string, updates: Partial<T>): Promise<T | null> {
    try {
      const collection = this.getCollection();
      const updateDoc = {
        ...updates,
        updatedAt: new Date(),
      };

      let query: any = { _id: id };

      // Try as ObjectId if it looks like one
      try {
        if (ObjectId.isValid(id)) {
          const objectId = new ObjectId(id);
          const result = await collection.findOneAndUpdate(
            { _id: objectId } as any,
            { $set: updateDoc },
            { returnDocument: 'after' }
          );
          if (result?.value) return result.value;
        }
      } catch (err) {
        logger.debug('ObjectId update failed', err);
      }

      // Fall back to string query
      const result = await collection.findOneAndUpdate(query, { $set: updateDoc }, {
        returnDocument: 'after',
      });
      return result?.value || null;
    } catch (error) {
      logger.error(`Failed to update ${this.collectionName}`, error);
      throw error;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      let query: any = { _id: id };

      // Try as ObjectId if it looks like one
      try {
        if (ObjectId.isValid(id)) {
          const objectId = new ObjectId(id);
          const result = await collection.deleteOne({ _id: objectId } as any);
          if (result.deletedCount > 0) return true;
        }
      } catch (err) {
        logger.debug('ObjectId delete failed', err);
      }

      // Fall back to string query
      const result = await collection.deleteOne(query);
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Failed to delete ${this.collectionName}`, error);
      throw error;
    }
  }

  async count(filter: any = {}): Promise<number> {
    try {
      const collection = this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      logger.error(`Failed to count ${this.collectionName}`, error);
      throw error;
    }
  }

  async deleteMany(filter: any): Promise<number> {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteMany(filter);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Failed to delete many from ${this.collectionName}`, error);
      throw error;
    }
  }
}

/**
 * Asset repository for asset-specific operations
 */
export class AssetRepository extends BaseRepository<any> {
  constructor() {
    super('assets');
  }

  async findByDepartment(department: string, skip?: number, limit?: number) {
    return this.findAll({ department }, { skip, limit, sort: { createdAt: -1 } });
  }

  async findByStatus(status: string, skip?: number, limit?: number) {
    return this.findAll({ currentStatus: status }, { skip, limit, sort: { createdAt: -1 } });
  }

  async searchAssets(query: string, skip?: number, limit?: number) {
    const filter = {
      $or: [
        { assetNumber: { $regex: query, $options: 'i' } },
        { assetDescription: { $regex: query, $options: 'i' } },
        { serialNumber: { $regex: query, $options: 'i' } },
      ],
    };
    return this.findAll(filter, { skip, limit, sort: { createdAt: -1 } });
  }
}

/**
 * User repository for user-specific operations
 */
export class UserRepository extends BaseRepository<any> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string) {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByRole(role: string, skip?: number, limit?: number) {
    return this.findAll({ role }, { skip, limit });
  }
}

