import { NextRequest } from 'next/server'
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils'
import { authService, CookieManager } from '@/lib/auth-service'

async function getCurrentUserHandler(request: NextRequest) {
  // Get token from cookie
  const token = CookieManager.getAuthCookie()
  if (!token) {
    throw new Error('No authentication token found')
  }

  // Get current user
  const user = await authService.getCurrentUser(token)

  return createSuccessResponse(user)
}

export const GET = withErrorHandling(getCurrentUserHandler)