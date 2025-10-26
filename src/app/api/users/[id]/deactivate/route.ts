import { NextRequest } from 'next/server'
import { createSuccessResponse, validateObjectId } from '@/lib/api-utils'
import { withAdminApiMiddleware } from '@/lib/auth-middleware'
import { authService } from '@/lib/auth-service'

// POST /api/users/[id]/deactivate - Deactivate user (admin only)
async function deactivateUserHandler(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  const userId = params.id
  validateObjectId(userId)

  await authService.deactivateUser(user.id, userId)

  return createSuccessResponse(null, 'User deactivated successfully')
}

export const POST = withAdminApiMiddleware(deactivateUserHandler)