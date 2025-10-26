import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { WorkPermit } from '@/types/database'
import { ObjectId, isValidObjectId } from '@/types/server-types'

type Params = {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = new ObjectId(params.id)
    const { status, approvedBy } = await request.json()
    
    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status. Must be either approved or rejected')
    }
    
    const collection = await getCollection<WorkPermit>('workPermits')
    const result = await collection.updateOne(
      { _id: id },
      { 
        $set: {
          status,
          approvedBy: new ObjectId(approvedBy),
          updatedAt: new Date()
        }
      }
    )
    
    if (!result.matchedCount) {
      throw new ApiError(404, 'Work permit not found')
    }
    
    return Response.json({ 
      message: `Work permit ${status} successfully`
    })
  } catch (error) {
    return handleApiError(error)
  }
}