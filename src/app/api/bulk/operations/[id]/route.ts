import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { bulkOperationsService } from '@/lib/bulk-operations-service'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/bulk/operations/[id] - Get operation progress
async function getOperationProgressHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const operationId = params.id

    if (!operationId) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      )
    }

    const progress = bulkOperationsService.getOperationProgress(operationId)

    if (!progress) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      )
    }

    return createSuccessResponse({
      progress,
      percentComplete: progress.totalItems > 0 
        ? Math.round((progress.processedItems / progress.totalItems) * 100)
        : 0
    })
  } catch (error) {
    console.error('Get operation progress error:', error)
    return NextResponse.json(
      { error: 'Failed to get operation progress' },
      { status: 500 }
    )
  }
}

// DELETE /api/bulk/operations/[id] - Cancel operation
async function cancelOperationHandler(
  request: NextRequest,
  user: JWTPayload,
  { params }: { params: { id: string } }
) {
  try {
    const operationId = params.id

    if (!operationId) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      )
    }

    const cancelled = bulkOperationsService.cancelOperation(operationId)

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Operation cannot be cancelled or not found' },
        { status: 400 }
      )
    }

    return createSuccessResponse({
      message: 'Operation cancelled successfully',
      operationId
    })
  } catch (error) {
    console.error('Cancel operation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel operation' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getOperationProgressHandler)
export const DELETE = withApiMiddleware(cancelOperationHandler)