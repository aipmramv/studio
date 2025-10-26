import 'server-only'

import { MongoClient, Db, Collection, MongoClientOptions, Document, OptionalUnlessRequiredId, WithId } from 'mongodb';
import { ObjectId, ClientSession } from '@/types/server-types';
import { AssetManagementFormData } from './schemas';
import { User } from '@/types/database';

import clientPromise from './mongodb'

// Database configuration
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'kti_assets';

// Enhanced connection management with pooling and error handling
export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<Db> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  private constructor() {
    // Set up process event handlers for graceful shutdown
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
  }

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<Db> {
    // Return existing connection if available
    if (this.db && this.client) {
      try {
        // Test the connection
        await this.db.admin().ping();
        return this.db;
      } catch (error) {
        console.warn('Existing connection failed ping test, reconnecting...');
        this.db = null;
        this.client = null;
      }
    }

    // Return existing connection promise if already connecting
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.isConnecting = true;
    this.connectionPromise = this.establishConnection();

    try {
      const db = await this.connectionPromise;
      this.isConnecting = false;
      this.reconnectAttempts = 0; // Reset on successful connection
      return db;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  private async establishConnection(): Promise<Db> {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

      this.client = await clientPromise;
      this.db = this.client.db(DATABASE_NAME);

      // Verify connection with ping
      await this.db.admin().ping();

      console.log(`Connected to MongoDB successfully (Database: ${DATABASE_NAME})`);

      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);

      this.reconnectAttempts++;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        console.log(`Retrying connection in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.establishConnection();
      } else {
        throw new Error(`Failed to connect to MongoDB after ${this.maxReconnectAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        console.log('Disconnected from MongoDB');
      } catch (error) {
        console.error('Error during MongoDB disconnection:', error);
      } finally {
        this.client = null;
        this.db = null;
        this.isConnecting = false;
        this.connectionPromise = null;
      }
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }
    return this.client;
  }

  public async startSession(): Promise<ClientSession> {
    if (!this.client) {
      await this.connect();
    }
    return this.client!.startSession();
  }

  public isConnected(): boolean {
    return this.db !== null && this.client !== null;
  }

  // Event handlers
  private handleConnectionError(error: Error): void {
    console.error('MongoDB connection error:', error);
  }

  private handleConnectionClose(): void {
    console.warn('MongoDB connection closed');
    this.db = null;
  }

  private handleReconnect(): void {
    console.log('MongoDB reconnected successfully');
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('Shutting down MongoDB connection...');
    await this.disconnect();
    process.exit(0);
  }

  private handleUncaughtException(error: Error): void {
    console.error('Uncaught exception:', error);
    this.disconnect().finally(() => {
      process.exit(1);
    });
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.db) {
        return { status: 'disconnected', details: { message: 'No database connection' } };
      }

      const startTime = Date.now();
      await this.db.admin().ping();
      const responseTime = Date.now() - startTime;

      const stats = await this.db.stats();

      return {
        status: 'connected',
        details: {
          responseTime: `${responseTime}ms`,
          database: DATABASE_NAME,
          collections: stats.collections,
          dataSize: stats.dataSize,
          indexSize: stats.indexSize,
          storageSize: stats.storageSize
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error.name : 'Unknown'
        }
      };
    }
  }
}

// Enhanced base service class with better error handling
export abstract class BaseMongoService<T extends Document> {
  protected db!: Db;
  protected collection!: Collection<T>;
  protected collectionName: string;
  protected connection: MongoDBConnection;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.connection = MongoDBConnection.getInstance();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      this.db = await this.connection.connect();
      this.collection = this.db.collection<T>(this.collectionName);
    } catch (error) {
      console.error(`Failed to initialize ${this.collectionName} service:`, error);
      throw error;
    }
  }

  protected async ensureConnection(): Promise<void> {
    try {
      if (!this.connection.isConnected()) {
        this.db = await this.connection.connect();
        this.collection = this.db.collection<T>(this.collectionName);
      } else {
        // Test the connection
        await this.db.admin().ping();
      }
    } catch (error) {
      console.warn(`Connection test failed for ${this.collectionName}, reconnecting...`);
      this.db = await this.connection.connect();
      this.collection = this.db.collection<T>(this.collectionName);
    }
  }

  protected handleError(operation: string, error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullErrorMessage = `${this.collectionName} ${operation} failed: ${errorMessage}`;
    console.error(fullErrorMessage, {
      collection: this.collectionName,
      operation,
      error: error instanceof Error ? error.stack || error : error
    });

    // Throw a more descriptive error
    if (error instanceof Error) {
      if ('code' in error && (error as any).code === 11000) {
        throw new Error(`Duplicate key error in ${this.collectionName}: ${errorMessage}`);
      } else if (error.name === 'ValidationError') {
        throw new Error(`Validation error in ${this.collectionName}: ${errorMessage}`);
      } else if (error.name === 'CastError') {
        throw new Error(`Invalid data type in ${this.collectionName}: ${errorMessage}`);
      }
    }
    throw new Error(fullErrorMessage);
  }

  // Enhanced CRUD operations with validation and error handling
  public async create(data: OptionalUnlessRequiredId<T>, session?: ClientSession): Promise<string> {
    try {
      await this.ensureConnection();

      // Validate input data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data provided for creation');
      }

      const document = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OptionalUnlessRequiredId<T>;

      const options = session ? { session } : {};
      const result = await this.collection.insertOne(document, options);

      if (!result.insertedId) {
        throw new Error('Failed to create document - no ID returned');
      }

      return result.insertedId.toString();
    } catch (error) {
      this.handleError('create', error);
    }
  }

  public async findById(id: string, session?: ClientSession): Promise<WithId<T> | null> {
    try {
      await this.ensureConnection();

      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId format: ${id}`);
      }

      const objectId = new ObjectId(id);
      const options = session ? { session } : {};

      const result = await this.collection.findOne({ _id: objectId } as any, options);
      return result as WithId<T> | null;
    } catch (error) {
      this.handleError('findById', error);
    }
  }

  public async findMany(
    filter: any = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: any;
      projection?: any;
      session?: ClientSession;
    } = {}
  ): Promise<WithId<T>[]> {
    try {
      await this.ensureConnection();

      const { session, ...queryOptions } = options;
      const findOptions = session ? { ...queryOptions, session } : queryOptions;

      const cursor = this.collection.find(filter, findOptions);

      if (options.sort) cursor.sort(options.sort);
      if (options.skip) cursor.skip(options.skip);
      if (options.limit) cursor.limit(options.limit);

      const result = await cursor.toArray();
      return result as WithId<T>[];
    } catch (error) {
      this.handleError('findMany', error);
    }
  }

  public async updateById(
    id: string,
    updates: Partial<T>,
    session?: ClientSession
  ): Promise<boolean> {
    try {
      await this.ensureConnection();

      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId format: ${id}`);
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid updates provided');
      }

      const objectId = new ObjectId(id);
      const updateDoc = {
        ...updates,
        updatedAt: new Date(),
      } as Partial<T> & { updatedAt: Date };

      // Remove undefined values
      Object.keys(updateDoc).forEach(key => {
        if ((updateDoc as any)[key] === undefined) {
          delete (updateDoc as any)[key];
        }
      });

      const options = session ? { session } : {};
      const result = await this.collection.updateOne(
        { _id: objectId } as any,
        { $set: updateDoc },
        options
      );

      return result.modifiedCount > 0;
    } catch (error) {
      this.handleError('updateById', error);
    }
  }

  public async updateMany(
    filter: any,
    updates: Partial<T>,
    session?: ClientSession
  ): Promise<number> {
    try {
      await this.ensureConnection();

      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid updates provided');
      }

      const updateDoc = {
        ...updates,
        updatedAt: new Date(),
      } as Partial<T> & { updatedAt: Date };

      // Remove undefined values
      Object.keys(updateDoc).forEach(key => {
        if ((updateDoc as any)[key] === undefined) {
          delete (updateDoc as any)[key];
        }
      });

      const options = session ? { session } : {};
      const result = await this.collection.updateMany(
        filter,
        { $set: updateDoc },
        options
      );

      return result.modifiedCount;
    } catch (error) {
      this.handleError('updateMany', error);
    }
  }

  public async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    try {
      await this.ensureConnection();

      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId format: ${id}`);
      }

      const objectId = new ObjectId(id);
      const options = session ? { session } : {};

      const result = await this.collection.deleteOne({ _id: objectId } as any, options);
      return result.deletedCount > 0;
    } catch (error) {
      this.handleError('deleteById', error);
    }
  }

  public async deleteMany(filter: any, session?: ClientSession): Promise<number> {
    try {
      await this.ensureConnection();

      const options = session ? { session } : {};
      const result = await this.collection.deleteMany(filter, options);
      return result.deletedCount;
    } catch (error) {
      this.handleError('deleteMany', error);
    }
  }

  public async count(filter: any = {}, session?: ClientSession): Promise<number> {
    try {
      await this.ensureConnection();

      const options = session ? { session } : {};
      return await this.collection.countDocuments(filter, options);
    } catch (error) {
      this.handleError('count', error);
    }
  }

  public async exists(filter: any, session?: ClientSession): Promise<boolean> {
    try {
      await this.ensureConnection();

      const options = session ? { session } : {};
      const result = await this.collection.findOne(filter, { ...options, projection: { _id: 1 } });
      return result !== null;
    } catch (error) {
      this.handleError('exists', error);
    }
  }

  // Enhanced transaction support
  public async withTransaction<R>(
    operation: (session: ClientSession) => Promise<R>,
    options?: {
      readPreference?: any;
      readConcern?: any;
      writeConcern?: any;
      maxCommitTimeMS?: number;
    }
  ): Promise<R> {
    const session = await this.connection.startSession();

    try {
      const transactionOptions = {
        readPreference: 'primary' as any,
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
        maxCommitTimeMS: 10000,
        ...options
      };

      const result = await session.withTransaction(operation, transactionOptions);
      return result as R;
    } catch (error) {
      console.error(`Transaction failed in ${this.collectionName}:`, error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Bulk operations
  public async bulkWrite(operations: any[], session?: ClientSession): Promise<any> {
    try {
      await this.ensureConnection();

      if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('Invalid bulk operations provided');
      }

      const options = session ? { session } : {};
      return await this.collection.bulkWrite(operations, options);
    } catch (error) {
      this.handleError('bulkWrite', error);
    }
  }

  // Aggregation support
  public async aggregate<R = Document>(pipeline: any[], session?: ClientSession): Promise<R[]> {
    try {
      await this.ensureConnection();

      if (!Array.isArray(pipeline)) {
        throw new Error('Invalid aggregation pipeline provided');
      }

      const options = session ? { session } : {};
      const cursor = this.collection.aggregate(pipeline, options);
      const result = await cursor.toArray();
      return result as R[];
    } catch (error) {
      this.handleError('aggregate', error);
    }
  }

  // Index management
  public async createIndex(
    indexSpec: any,
    options?: { unique?: boolean; sparse?: boolean; background?: boolean }
  ): Promise<string> {
    try {
      await this.ensureConnection();

      const indexOptions = {
        background: true,
        ...options
      };

      return await this.collection.createIndex(indexSpec, indexOptions);
    } catch (error) {
      this.handleError('createIndex', error);
    }
  }

  public async dropIndex(indexName: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.collection.dropIndex(indexName);
    } catch (error) {
      this.handleError('dropIndex', error);
    }
  }

  public async listIndexes(): Promise<any[]> {
    try {
      await this.ensureConnection();
      const cursor = this.collection.listIndexes();
      return await cursor.toArray();
    } catch (error) {
      this.handleError('listIndexes', error);
    }
  }
}

// Asset-specific service
export interface AssetDocument extends AssetManagementFormData {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export class AssetService extends BaseMongoService<AssetDocument> {
  constructor() {
    super('assets');
  }

  public async createAsset(
    assetData: AssetManagementFormData,
    userId: string
  ): Promise<string> {
    await this.ensureConnection();

    // Generate unique asset number if not provided
    if (!assetData.assetNumber) {
      assetData.assetNumber = await this.generateAssetNumber();
    }

    // Validate unique asset number
    const existingAsset = await this.collection.findOne({
      assetNumber: assetData.assetNumber
    });

    if (existingAsset) {
      throw new Error(`Asset number ${assetData.assetNumber} already exists`);
    }

    const document: Omit<AssetDocument, '_id'> = {
      ...assetData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      lastModifiedBy: userId,
    };

    const result = await this.collection.insertOne(document as AssetDocument);
    return result.insertedId.toString();
  }

  public async updateAsset(
    id: string,
    updates: Partial<AssetManagementFormData>,
    userId: string
  ): Promise<boolean> {
    await this.ensureConnection();

    const updateDoc = {
      ...updates,
      updatedAt: new Date(),
      lastModifiedBy: userId,
    };

    const objectId = new ObjectId(id);
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $set: updateDoc }
    );

    return result.modifiedCount > 0;
  }

  public async searchAssets(query: {
    searchTerm?: string;
    department?: string;
    location?: string;
    status?: string;
    classification?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ assets: AssetDocument[]; total: number }> {
    await this.ensureConnection();

    const filter: any = {};

    // Text search
    if (query.searchTerm) {
      filter.$or = [
        { assetNumber: { $regex: query.searchTerm, $options: 'i' } },
        { assetDescription: { $regex: query.searchTerm, $options: 'i' } },
        { kmNumber: { $regex: query.searchTerm, $options: 'i' } },
        { productSerialNo: { $regex: query.searchTerm, $options: 'i' } },
      ];
    }

    // Filters
    if (query.department) filter.department = query.department as any;
    if (query.location) filter.location = query.location;
    if (query.status) filter.currentStatus = query.status;
    if (query.classification) filter.assetClassification = query.classification;

    const total = await this.collection.countDocuments(filter);

    const assets = await this.collection
      .find(filter)
      .skip(query.skip || 0)
      .limit(query.limit || 50)
      .sort({ updatedAt: -1 })
      .toArray();

    return { assets, total };
  }

  public async getAssetsByDepartment(department: string): Promise<AssetDocument[]> {
    await this.ensureConnection();

    return await this.collection
      .find({ department: department as any })
      .sort({ assetNumber: 1 })
      .toArray();
  }

  public async getAssetHistory(assetId: string): Promise<any[]> {
    await this.ensureConnection();

    // This would typically join with a separate movements/history collection
    // For now, we'll return a placeholder
    return [];
  }

  private async generateAssetNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `KTI-${year}-`;

    // Find the highest existing number for this year
    const lastAsset = await this.collection
      .findOne(
        { assetNumber: { $regex: `^${prefix}` } },
        { sort: { assetNumber: -1 } }
      );

    let nextNumber = 1;
    if (lastAsset?.assetNumber) {
      const lastNumber = parseInt(lastAsset.assetNumber.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Analytics methods
  public async getAssetCountByStatus(): Promise<Record<string, number>> {
    await this.ensureConnection();

    const pipeline = [
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await this.collection.aggregate(pipeline).toArray();

    const statusCounts: Record<string, number> = {};
    results.forEach(result => {
      statusCounts[result._id || 'Unknown'] = result.count;
    });

    return statusCounts;
  }

  public async getAssetCountByDepartment(): Promise<Record<string, number>> {
    await this.ensureConnection();

    const pipeline = [
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await this.collection.aggregate(pipeline).toArray();

    const departmentCounts: Record<string, number> = {};
    results.forEach(result => {
      departmentCounts[result._id || 'Unknown'] = result.count;
    });

    return departmentCounts;
  }

  public async getAssetCountByClassification(): Promise<Record<string, number>> {
    await this.ensureConnection();

    const pipeline = [
      {
        $group: {
          _id: '$assetClassification',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await this.collection.aggregate(pipeline).toArray();

    const classificationCounts: Record<string, number> = {};
    results.forEach(result => {
      classificationCounts[result._id || 'Unknown'] = result.count;
    });

    return classificationCounts;
  }
}

// User service
export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  role: 'admin' | 'user';
  password: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService extends BaseMongoService<UserDocument> {
  constructor() {
    super('users');
  }

  public async createUser(userData: Omit<UserDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.ensureConnection();

    // Check if user already exists
    const existingUser = await this.collection.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const document: Omit<UserDocument, '_id'> = {
      ...userData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(document as UserDocument);
    return result.insertedId.toString();
  }

  public async findByEmail(email: string): Promise<UserDocument | null> {
    await this.ensureConnection();
    return await this.collection.findOne({ email });
  }

  public async updateLastLogin(userId: string): Promise<void> {
    await this.ensureConnection();

    const objectId = new ObjectId(userId);
    await this.collection.updateOne(
      { _id: objectId },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  public async getUsersByRole(role: string): Promise<UserDocument[]> {
    await this.ensureConnection();

    const result = await this.collection
      .find({ role: role as any, isActive: true })
      .sort({ name: 1 })
      .toArray();
    return result as UserDocument[];
  }

  public async getUsersByDepartment(department: string): Promise<UserDocument[]> {
    await this.ensureConnection();

    return await this.collection
      .find({ department, isActive: true })
      .sort({ name: 1 })
      .toArray();
  }

  public async updateUser(
    userId: string,
    updates: Partial<UserDocument>,
    updatedBy: string
  ): Promise<boolean> {
    await this.ensureConnection();

    const updateDoc = {
      ...updates,
      updatedAt: new Date(),
      lastModifiedBy: updatedBy,
    };

    const objectId = new ObjectId(userId);
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $set: updateDoc }
    );

    return result.modifiedCount > 0;
  }
}

// Workflow service
export interface WorkflowDocument {
  _id?: ObjectId;
  type: string;
  templateId: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;

  // Current state
  currentStepId: string;
  currentStepName: string;
  currentAssignees: string[];
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'voided';

  // Data
  payload: Record<string, any>;

  // History
  history: Array<{
    stepId: string;
    stepName: string;
    action: string;
    actor: string;
    timestamp: Date;
    comment?: string;
  }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isVoided?: boolean;
  voidReason?: string;
}

export class WorkflowService extends BaseMongoService<WorkflowDocument> {
  constructor() {
    super('workflows');
  }

  public async createWorkflow(workflowData: Omit<WorkflowDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.ensureConnection();

    const document: Omit<WorkflowDocument, '_id'> = {
      ...workflowData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(document as WorkflowDocument);
    return result.insertedId.toString();
  }

  public async updateWorkflowStep(
    workflowId: string,
    stepUpdate: {
      currentStepId: string;
      currentStepName: string;
      currentAssignees: string[];
      status?: string;
      historyItem: WorkflowDocument['history'][0];
    }
  ): Promise<boolean> {
    await this.ensureConnection();

    const objectId = new ObjectId(workflowId);
    const updateDoc: any = {
      currentStepId: stepUpdate.currentStepId,
      currentStepName: stepUpdate.currentStepName,
      currentAssignees: stepUpdate.currentAssignees,
      updatedAt: new Date(),
      $push: { history: stepUpdate.historyItem }
    };

    if (stepUpdate.status) {
      updateDoc.status = stepUpdate.status;
      if (stepUpdate.status === 'completed') {
        updateDoc.completedAt = new Date();
      }
    }

    const result = await this.collection.updateOne(
      { _id: objectId },
      updateDoc
    );

    return result.modifiedCount > 0;
  }

  public async getWorkflowsByAssignee(assigneeRole: string): Promise<WorkflowDocument[]> {
    await this.ensureConnection();

    return await this.collection
      .find({
        currentAssignees: assigneeRole,
        status: { $in: ['pending', 'approved'] }
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async getWorkflowsByRequester(requesterId: string): Promise<WorkflowDocument[]> {
    await this.ensureConnection();

    return await this.collection
      .find({ requesterId })
      .sort({ createdAt: -1 })
      .toArray();
  }
}

// Enhanced database initialization with comprehensive indexing
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing MongoDB database...');

    const connection = MongoDBConnection.getInstance();
    await connection.connect();

    // Initialize performance optimization
    const { databasePerformanceOptimizer } = await import('./database-performance');
    await databasePerformanceOptimizer.initialize();

    // Start connection pool monitoring
    const { connectionPoolMonitor } = await import('./connection-pool-monitor');
    connectionPoolMonitor.startMonitoring();

    // Create indexes for better performance
    await createIndexes();

    // Validate database setup
    await validateDatabaseSetup();

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  const connection = MongoDBConnection.getInstance();
  const db = await connection.connect();

  try {
    // Assets collection indexes
    const assetsCollection = db.collection('assets');
    await assetsCollection.createIndex({ assetNumber: 1 }, { unique: true, background: true });
    await assetsCollection.createIndex({ department: 1, currentStatus: 1 }, { background: true });
    await assetsCollection.createIndex({ location: 1, currentStatus: 1 }, { background: true });
    await assetsCollection.createIndex({
      assetDescription: 'text',
      assetNumber: 'text',
      kmNumber: 'text',
      productSerialNo: 'text'
    }, { background: true });
    await assetsCollection.createIndex({ createdAt: -1 }, { background: true });
    await assetsCollection.createIndex({ updatedAt: -1 }, { background: true });

    // Users collection indexes
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true, background: true });
    await usersCollection.createIndex({ role: 1, isActive: 1 }, { background: true });
    await usersCollection.createIndex({ department: 1, role: 1 }, { background: true });

    // Workflows collection indexes
    const workflowsCollection = db.collection('workflows');
    await workflowsCollection.createIndex({ status: 1, currentAssignees: 1 }, { background: true });
    await workflowsCollection.createIndex({ requesterId: 1, createdAt: -1 }, { background: true });
    await workflowsCollection.createIndex({ type: 1, status: 1 }, { background: true });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Failed to create indexes:', error);
    throw error;
  }
}

async function validateDatabaseSetup(): Promise<void> {
  const connection = MongoDBConnection.getInstance();
  const db = await connection.connect();

  try {
    // Test database connectivity
    await db.admin().ping();

    // Verify collections exist or can be created
    const collections = ['assets', 'users', 'workflows', 'masterData'];
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      await collection.findOne({}); // This will create the collection if it doesn't exist
    }

    console.log('Database setup validation completed');
  } catch (error) {
    console.error('Database validation failed:', error);
    throw error;
  }
}

async function createOptimizedIndexes(): Promise<void> {
  const db = MongoDBConnection.getInstance().getDb();

  try {
    console.log('Creating database indexes...');

    // Asset indexes for optimal query performance
    const assetsCollection = db.collection('assets');

    // Unique indexes
    await assetsCollection.createIndex({ assetNumber: 1 }, {
      unique: true,
      background: true,
      name: 'idx_asset_number_unique'
    });

    // Single field indexes
    await assetsCollection.createIndex({ department: 1 }, {
      background: true,
      name: 'idx_department'
    });
    await assetsCollection.createIndex({ location: 1 }, {
      background: true,
      name: 'idx_location'
    });
    await assetsCollection.createIndex({ currentStatus: 1 }, {
      background: true,
      name: 'idx_current_status'
    });
    await assetsCollection.createIndex({ assetClassification: 1 }, {
      background: true,
      name: 'idx_asset_classification'
    });
    await assetsCollection.createIndex({ createdBy: 1 }, {
      background: true,
      name: 'idx_created_by'
    });
    await assetsCollection.createIndex({ createdAt: -1 }, {
      background: true,
      name: 'idx_created_at_desc'
    });
    await assetsCollection.createIndex({ updatedAt: -1 }, {
      background: true,
      name: 'idx_updated_at_desc'
    });

    // Compound indexes for common query patterns
    await assetsCollection.createIndex(
      { department: 1, currentStatus: 1 },
      { background: true, name: 'idx_dept_status' }
    );
    await assetsCollection.createIndex(
      { department: 1, location: 1 },
      { background: true, name: 'idx_dept_location' }
    );
    await assetsCollection.createIndex(
      { assetClassification: 1, currentStatus: 1 },
      { background: true, name: 'idx_class_status' }
    );

    // Text search index for full-text search
    await assetsCollection.createIndex({
      assetNumber: 'text',
      assetDescription: 'text',
      kmNumber: 'text',
      productSerialNo: 'text',
      brandName: 'text',
      modelNo: 'text'
    }, {
      background: true,
      name: 'idx_text_search',
      weights: {
        assetNumber: 10,
        assetDescription: 5,
        kmNumber: 8,
        productSerialNo: 3,
        brandName: 2,
        modelNo: 2
      }
    });

    // User indexes
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, {
      unique: true,
      background: true,
      name: 'idx_email_unique'
    });
    await usersCollection.createIndex({ role: 1 }, {
      background: true,
      name: 'idx_role'
    });
    await usersCollection.createIndex({ department: 1 }, {
      background: true,
      name: 'idx_user_department'
    });
    await usersCollection.createIndex({ isActive: 1 }, {
      background: true,
      name: 'idx_is_active'
    });
    await usersCollection.createIndex(
      { role: 1, isActive: 1 },
      { background: true, name: 'idx_role_active' }
    );
    await usersCollection.createIndex(
      { department: 1, isActive: 1 },
      { background: true, name: 'idx_dept_active' }
    );

    // Workflow indexes
    const workflowsCollection = db.collection('workflows');
    await workflowsCollection.createIndex({ requesterId: 1 }, {
      background: true,
      name: 'idx_requester_id'
    });
    await workflowsCollection.createIndex({ currentAssignees: 1 }, {
      background: true,
      name: 'idx_current_assignees'
    });
    await workflowsCollection.createIndex({ status: 1 }, {
      background: true,
      name: 'idx_workflow_status'
    });
    await workflowsCollection.createIndex({ type: 1 }, {
      background: true,
      name: 'idx_workflow_type'
    });
    await workflowsCollection.createIndex({ createdAt: -1 }, {
      background: true,
      name: 'idx_workflow_created_desc'
    });
    await workflowsCollection.createIndex({ updatedAt: -1 }, {
      background: true,
      name: 'idx_workflow_updated_desc'
    });

    // Compound indexes for workflow queries
    await workflowsCollection.createIndex(
      { status: 1, createdAt: -1 },
      { background: true, name: 'idx_status_created' }
    );
    await workflowsCollection.createIndex(
      { requesterId: 1, status: 1 },
      { background: true, name: 'idx_requester_status' }
    );
    await workflowsCollection.createIndex(
      { type: 1, status: 1 },
      { background: true, name: 'idx_type_status' }
    );

    // Asset movements/history indexes (if using separate collection)
    const movementsCollection = db.collection('assetMovements');
    await movementsCollection.createIndex({ assetId: 1 }, {
      background: true,
      name: 'idx_asset_id'
    });
    await movementsCollection.createIndex({ createdAt: -1 }, {
      background: true,
      name: 'idx_movement_created_desc'
    });
    await movementsCollection.createIndex(
      { assetId: 1, createdAt: -1 },
      { background: true, name: 'idx_asset_movement_history' }
    );

    // Master data indexes
    const masterDataCollection = db.collection('masterData');
    await masterDataCollection.createIndex({ type: 1 }, {
      background: true,
      name: 'idx_master_type'
    });
    await masterDataCollection.createIndex({ 'value.code': 1 }, {
      background: true,
      name: 'idx_master_code'
    });
    await masterDataCollection.createIndex(
      { type: 1, 'value.isActive': 1 },
      { background: true, name: 'idx_type_active' }
    );

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

// Database utilities
export class DatabaseUtils {
  /**
   * Backup collection data
   */
  static async backupCollection(collectionName: string): Promise<any[]> {
    const db = MongoDBConnection.getInstance().getDb();
    const collection = db.collection(collectionName);

    return await collection.find({}).toArray();
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<any> {
    const db = MongoDBConnection.getInstance().getDb();

    const stats = await db.stats();
    const collections = await db.listCollections().toArray();

    const collectionStats: Record<string, any> = {};
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      const indexes = await collection.listIndexes().toArray();

      collectionStats[col.name] = {
        documentCount: count,
        indexCount: indexes.length,
        indexes: indexes.map(idx => ({ name: idx.name, keys: idx.key }))
      };
    }

    return {
      database: stats,
      collections: collectionStats
    };
  }

  /**
   * Clean up old data based on retention policy
   */
  static async cleanupOldData(
    collectionName: string,
    dateField: string = 'createdAt',
    retentionDays: number = 365
  ): Promise<number> {
    const db = MongoDBConnection.getInstance().getDb();
    const collection = db.collection(collectionName);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await collection.deleteMany({
      [dateField]: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} old records from ${collectionName}`);
    return result.deletedCount;
  }

  /**
   * Optimize collection by rebuilding indexes
   */
  static async optimizeCollection(collectionName: string): Promise<void> {
    const db = MongoDBConnection.getInstance().getDb();

    try {
      await db.command({ reIndex: collectionName });
      console.log(`Optimized collection: ${collectionName}`);
    } catch (error) {
      console.error(`Failed to optimize collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Check collection health
   */
  static async checkCollectionHealth(collectionName: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    details: any;
  }> {
    const db = MongoDBConnection.getInstance().getDb();
    const collection = db.collection(collectionName);

    try {
      const stats = await collection.stats();
      const indexes = await collection.listIndexes().toArray();

      const health: { status: 'healthy' | 'warning' | 'error'; details: any } = {
        status: 'healthy',
        details: {
          documentCount: stats.count,
          storageSize: stats.storageSize,
          indexCount: indexes.length,
          avgDocumentSize: stats.avgObjSize,
          totalIndexSize: stats.totalIndexSize
        }
      };

      // Check for potential issues
      if (stats.count > 1000000) {
        health.status = 'warning';
        (health.details as any).warning = 'Large collection - consider partitioning';
      }

      if (indexes.length < 2) {
        health.status = 'warning';
        (health.details as any).warning = 'Few indexes - may impact query performance';
      }

      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        details: { error: errorMessage }
      };
    }
  }
}

// Migration utilities
export class MigrationUtils {
  /**
   * Run data migration
   */
  static async runMigration(
    migrationName: string,
    migrationFunction: (db: Db, session?: ClientSession) => Promise<void>
  ): Promise<void> {
    const connection = MongoDBConnection.getInstance();
    const db = connection.getDb();

    // Check if migration already ran
    const migrationsCollection = db.collection('migrations');
    const existingMigration = await migrationsCollection.findOne({ name: migrationName });

    if (existingMigration) {
      console.log(`Migration '${migrationName}' already applied, skipping...`);
      return;
    }

    console.log(`Running migration: ${migrationName}`);

    const session = await connection.startSession();

    try {
      await session.withTransaction(async (session) => {
        // Run the migration
        await migrationFunction(db, session);

        // Record migration as completed
        await migrationsCollection.insertOne({
          name: migrationName,
          appliedAt: new Date(),
          status: 'completed'
        }, { session });
      });

      console.log(`Migration '${migrationName}' completed successfully`);
    } catch (error) {
      console.error(`Migration '${migrationName}' failed:`, error);

      // Record failed migration
      await migrationsCollection.insertOne({
        name: migrationName,
        appliedAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get migration history
   */
  static async getMigrationHistory(): Promise<any[]> {
    const db = MongoDBConnection.getInstance().getDb();
    const migrationsCollection = db.collection('migrations');

    return await migrationsCollection
      .find({})
      .sort({ appliedAt: -1 })
      .toArray();
  }
}

// Export service instances
export const assetService = new AssetService();
export const userService = new UserService();
export const workflowService = new WorkflowService();

// All exports are already declared above with their respective classes and functions