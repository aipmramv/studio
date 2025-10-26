import { NextRequest } from 'next/server'
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils'
import { authService, CookieManager } from '@/lib/auth-service'

async function changePasswordHandler(request: NextRequest) {
  const { currentPassword, newPassword } = await request.json()

  // Get token from cookie
  const token = CookieManager.getAuthCookie()
  if (!token) {
    throw new Error('No authentication token found')
  }

  // Get current user
  const user = await authService.getCurrentUser(token)

  // Change password
  await authService.changePassword(user.id, currentPassword, newPassword)

  return createSuccessResponse(
    null,
    'Password changed successfully'
  )
}

export const POST = withErrorHandling(changePasswordHandler)