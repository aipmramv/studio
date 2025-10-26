import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { userManagementService } from '@/lib/user-management-service'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// POST /api/auth/register - Register new user (admin only)
async function registerHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const { name, email, password, role, department, phone, employeeId } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    const userData = {
      name,
      email,
      password,
      role,
      department,
      phone,
      employeeId,
      isActive: true
    }

    const result = await userManagementService.registerUser(userData, user.id)

    return createSuccessResponse({
      user: result.user,
      message: result.message
    }, result.message, 201)
  } catch (error) {
    console.error('Register error:', error)
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    if (error.message.includes('Department is required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

export const POST = withUserManagement(registerHandler, 'create')