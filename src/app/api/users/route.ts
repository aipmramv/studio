
import { NextRequest, NextResponse } from 'next/server'
import { withUserManagement } from '@/lib/auth-middleware'
import { userManagementService } from '@/lib/user-management-service'
import { createSuccessResponse, parseFilterParams, parsePaginationParams } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'
import { query } from '@/lib/db'

// GET /api/users - Get users list with filtering and pagination
async function getUsersHandler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit } = parsePaginationParams(searchParams)
    const filters = parseFilterParams(searchParams)

    // Build filters
    const userFilters: any = {
      page,
      limit
    }

    if (filters.role) {
        const { rows } = await query('SELECT id FROM roles WHERE name = ', [filters.role]);
        if (rows.length > 0) userFilters.role = rows[0].id;
    }
    if (filters.department) {
        const { rows } = await query('SELECT id FROM departments WHERE name = ', [filters.department]);
        if (rows.length > 0) userFilters.department = rows[0].id;
    }
    if (filters.search) userFilters.search = filters.search
    if (filters.isActive !== undefined) userFilters.isActive = filters.isActive === 'true'

    // Non-admin users can only see users from their department
    if (user.role !== 'admin' && user.department_id) {
      userFilters.department = user.department_id;
    }

    const result = await userManagementService.getUsers(userFilters)

    return createSuccessResponse({
      ...result,
      userPermissions: {
        canCreate: user.role === 'admin',
        canEdit: user.role === 'admin',
        canDelete: user.role === 'admin',
        canViewAll: user.role === 'admin'
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (admin only)
async function createUserHandler(request: NextRequest, user: JWTPayload) {
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

    return createSuccessResponse(result, result.message, 201)
  } catch (error) {
    console.error('Create user error:', error)
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export const GET = withUserManagement(getUsersHandler, 'read')
export const POST = withUserManagement(createUserHandler, 'create')