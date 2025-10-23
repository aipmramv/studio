import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { Asset } from '@/types/database'
import { ObjectId } from 'mongodb'

type Params = {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = new ObjectId(params.id)
    const collection = await getCollection<Asset>('assets')
    const asset = await collection.findOne({ _id: id })
    
    if (!asset) {
      throw new ApiError(404, 'Asset not found')
    }
    
    return Response.json(asset)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = new ObjectId(params.id)
    const body = await request.json()
    const updateData = {
      ...body,
      updatedAt: new Date()
    }
    
    const collection = await getCollection<Asset>('assets')
    const result = await collection.updateOne(
      { _id: id },
      { $set: updateData }
    )
    
    if (!result.matchedCount) {
      throw new ApiError(404, 'Asset not found')
    }
    
    return Response.json({ 
      message: 'Asset updated successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = new ObjectId(params.id)
    const collection = await getCollection<Asset>('assets')
    const result = await collection.deleteOne({ _id: id })
    
    if (!result.deletedCount) {
      throw new ApiError(404, 'Asset not found')
    }
    
    return Response.json({ 
      message: 'Asset deleted successfully'
    })
  } catch (error) {
    return handleApiError(error)
  }
}