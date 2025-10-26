import { NextRequest } from 'next/server'
import { handleApiError, createSuccessResponse, withErrorHandling } from '@/lib/api-utils'
import { authService, CookieManager } from '@/lib/auth-service'

async function signupHandler(request: NextRequest) {
  const { email, name, password, confirmPassword, department } = await request.json()

  // Validate password confirmation
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  // Register user (default role is 'user')
  const { user, token } = await authService.register({
    email,
    name,
    password,
    role: 'user',
    department,
  })

  // Set authentication cookie
  CookieManager.setAuthCookie(token)

  return createSuccessResponse(
    { user, token },
    'Account created successfully'
  )
}

export const POST = withErrorHandling(signupHandler)