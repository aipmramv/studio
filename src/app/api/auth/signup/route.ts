import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { User } from '@/types/database'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      throw new ApiError(400, 'Email, password, and name are required')
    }

    const collection = await getCollection<User>('users')
    
    // Check if user already exists
    const existingUser = await collection.findOne({ email })
    if (existingUser) {
      throw new ApiError(409, 'User already exists')
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Create new user
    const user: Omit<User, '_id'> = {
      email,
      password: hashedPassword,
      name,
      role: 'user', // Default role
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(user)

    if (!result.acknowledged) {
      throw new ApiError(500, 'Failed to create user')
    }

    // Return success without sensitive data
    return Response.json({
      message: 'User created successfully',
      user: {
        id: result.insertedId,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}