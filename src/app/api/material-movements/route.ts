import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { Transaction } from '@/types/database'
import { ObjectId, isValidObjectId } from '@/types/server-types'

export async function GET(request: NextRequest) {
  try {
    const collection = await getCollection<Transaction>('transactions')
    const transactions = await collection
      .find({ type: 'movement' })
      .sort({ date: -1 })
      .toArray()
    
    return Response.json(transactions)
  } catch (error) {
    return handleApiError(error)
  }
}

// Validate required fields for material movement
function validateMaterialMovement(body: any): asserts body is Omit<Transaction, '_id'> {
  const requiredFields = ['assetId', 'userId', 'details', 'location']
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`)
  }

  // Validate ObjectId fields
  try {
    if (body.assetId) new ObjectId(body.assetId)
    if (body.userId) new ObjectId(body.userId)
  } catch {
    throw new ApiError(400, 'Invalid assetId or userId format')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    validateMaterialMovement(body)
    
    const transaction: Omit<Transaction, '_id'> = {
      ...body,
      type: 'movement',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const collection = await getCollection<Transaction>('transactions')
    const result = await collection.insertOne(transaction)
    
    if (!result.acknowledged) {
      throw new ApiError(500, 'Failed to create material movement record')
    }
    
    return Response.json({ 
      message: 'Material movement recorded successfully',
      id: result.insertedId 
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}