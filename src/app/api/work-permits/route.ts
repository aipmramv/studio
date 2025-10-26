import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { WorkPermit } from '@/types/database'
import { ObjectId, isValidObjectId } from '@/types/server-types'

export async function GET(request: NextRequest) {
  try {
    const collection = await getCollection<WorkPermit>('workPermits')
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    
    const query = status ? { status } : {}
    const workPermits = await collection
      .find(query as any) // Type assertion needed due to MongoDB types
      .sort({ createdAt: -1 })
      .toArray()
    
    return Response.json(workPermits)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workPermit: Omit<WorkPermit, '_id'> = {
      ...body,
      status: 'pending',
      permitNumber: generatePermitNumber(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const collection = await getCollection<WorkPermit>('workPermits')
    const result = await collection.insertOne(workPermit as WorkPermit)
    
    if (!result.acknowledged) {
      throw new ApiError(500, 'Failed to create work permit')
    }
    
    return Response.json({ 
      message: 'Work permit created successfully',
      id: result.insertedId 
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

function generatePermitNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `WP-${year}${month}-${random}`
}