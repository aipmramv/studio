import { NextRequest } from 'next/server'
import { getCollection, handleApiError, ApiError } from '@/lib/api-utils'
import { User } from '@/types/database'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long!!'
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required')
    }

    const collection = await getCollection<User>('users')
    const user = await collection.findOne({ email })

    if (!user) {
      throw new ApiError(401, 'Invalid credentials')
    }

    const isValidPassword = await compare(password, user.password)
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user._id?.toString(),
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(SECRET_KEY)

    // Update last login
    await collection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    )

    // Set cookie
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    // Return user data (excluding sensitive fields)
    const { password: _, ...userData } = user
    return Response.json({
      user: userData,
      message: 'Login successful'
    })

  } catch (error) {
    return handleApiError(error)
  }
}