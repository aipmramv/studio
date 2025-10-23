import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { Asset } from '@/types/database'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const collection = await getCollection<Asset>('assets')
    const assets = await collection.find({}).toArray()
    return Response.json(assets)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const asset: Omit<Asset, '_id'> = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const collection = await getCollection<Asset>('assets')
    const result = await collection.insertOne(asset as Asset)
    
    if (!result.acknowledged) {
      throw new ApiError(500, 'Failed to create asset')
    }
    
    return Response.json({ 
      message: 'Asset created successfully',
      id: result.insertedId 
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}