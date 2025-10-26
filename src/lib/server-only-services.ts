import "server-only";

import clientPromise from "./mongodb";

// Type definitions for function parameters
interface QueryOptions {
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
}

interface AssetFilter {
    [key: string]: any;
}

interface WorkflowFilter {
    [key: string]: any;
}

// Simple database operations for server-side only
export async function getDatabase() {
    const client = await clientPromise
    return client.db(process.env.MONGODB_DATABASE || 'kti_assets')
}

// Asset operations
export async function getAssets(filter: AssetFilter = {}, options: QueryOptions = {}) {
    const db = await getDatabase()
    const collection = db.collection('assets')

    const { limit = 50, skip = 0, sort = { updatedAt: -1 } } = options

    const assets = await collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()

    const total = await collection.countDocuments(filter)

    return { assets, total }
}

export async function getAssetById(id: string) {
    const db = await getDatabase()
    const collection = db.collection('assets')
    const { ObjectId } = await import('mongodb')

    return await collection.findOne({ _id: new ObjectId(id) })
}

export async function createAsset(assetData: Record<string, any>) {
    const db = await getDatabase()
    const collection = db.collection('assets')

    const document = {
        ...assetData,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const result = await collection.insertOne(document)
    return result.insertedId.toString()
}

export async function updateAsset(id: string, updates: Record<string, any>) {
    const db = await getDatabase()
    const collection = db.collection('assets')
    const { ObjectId } = await import('mongodb')

    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        }
    )

    return result.modifiedCount > 0
}

export async function deleteAsset(id: string) {
    const db = await getDatabase()
    const collection = db.collection('assets')
    const { ObjectId } = await import('mongodb')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
}

// User operations
export async function getUserByEmail(email: string) {
    const db = await getDatabase()
    const collection = db.collection('users')

    return await collection.findOne({ email })
}

export async function createUser(userData: Record<string, any>) {
    const db = await getDatabase()
    const collection = db.collection('users')

    const document = {
        ...userData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const result = await collection.insertOne(document)
    return result.insertedId.toString()
}

// Workflow operations
export async function getWorkflows(filter: WorkflowFilter = {}, options: QueryOptions = {}) {
    const db = await getDatabase()
    const collection = db.collection('workflows')

    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options

    const workflows = await collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()

    const total = await collection.countDocuments(filter)

    return { workflows, total }
}

// Dashboard analytics
export async function getDashboardStats() {
    const db = await getDatabase()

    const [
        totalAssets,
        totalUsers,
        totalWorkflows,
        assetsByStatus
    ] = await Promise.all([
        db.collection('assets').countDocuments(),
        db.collection('users').countDocuments({ isActive: true }),
        db.collection('workflows').countDocuments(),
        db.collection('assets').aggregate([
            {
                $group: {
                    _id: '$currentStatus',
                    count: { $sum: 1 }
                }
            }
        ]).toArray()
    ])

    return {
        totalAssets,
        totalUsers,
        totalWorkflows,
        assetsByStatus: assetsByStatus.reduce((acc, item) => {
            acc[item._id || 'Unknown'] = item.count
            return acc
        }, {})
    }
}