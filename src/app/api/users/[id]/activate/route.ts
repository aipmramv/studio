import { NextRequest } from 'next/server'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { withAdminApiMiddleware } from '@/lib/auth-middleware'
import { authService } from '@/lib/auth-service'

// POST /api/users/[id]/activate - Activate user (admin only)
async function activateUserHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const userId = params.id
  validateObjectId(userId)

  await authService.activateUser(user.id, userId)

  return createSuccessResponse(null, 'User activated successfully')
}

export const POST = withAdminApiMiddleware(activateUserHandler)