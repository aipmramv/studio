import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { JWTPayload } from '@/types/auth'
import { RBACService } from '@/lib/rbac'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long!!'
)

// Route-specific permission requirements
const ROUTE_PERMISSIONS: Record<string, { resource: string; action: string }> = {
  '/api/assets': { resource: 'assets', action: 'read' },
  '/api/assets/create': { resource: 'assets', action: 'create' },
  '/api/assets/update': { resource: 'assets', action: 'update' },
  '/api/assets/delete': { resource: 'assets', action: 'delete' },
  '/api/workflows': { resource: 'workflows', action: 'read' },
  '/api/workflows/create': { resource: 'workflows', action: 'create' },
  '/api/workflows/approve': { resource: 'workflows', action: 'approve' },
  '/api/reports': { resource: 'reports', action: 'read' },
  '/api/reports/export': { resource: 'reports', action: 'export' },
  '/api/masters': { resource: 'masters', action: 'read' },
  '/api/masters/create': { resource: 'masters', action: 'create' },
  '/api/masters/update': { resource: 'masters', action: 'update' },
  '/api/masters/delete': { resource: 'masters', action: 'delete' },
  '/api/users': { resource: 'users', action: 'read' },
  '/api/users/create': { resource: 'users', action: 'create' },
  '/api/users/update': { resource: 'users', action: 'update' },
  '/api/users/delete': { resource: 'users', action: 'delete' },
}

export async function middleware(request: NextRequest) {
  // List of public paths that don't require authentication
  const publicPaths = [
    '/', 
    '/login', 
    '/signup',
    '/api/auth/login', 
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/health'
  ]
  
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith('/api/auth/')
  )

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Skip middleware for static files and Next.js internals
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/api/_next/')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return redirectToLogin(request)
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    const user = payload as JWTPayload
    
    // Check route-specific permissions for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const routePermission = getRoutePermission(request.nextUrl.pathname)
      
      if (routePermission) {
        const hasPermission = RBACService.hasPermission(
          user.role,
          routePermission.resource,
          routePermission.action
        )
        
        if (!hasPermission) {
          return NextResponse.json(
            { 
              error: { 
                message: `Insufficient permissions for ${routePermission.action} on ${routePermission.resource}`, 
                code: 'FORBIDDEN',
                statusCode: 403,
                timestamp: new Date().toISOString()
              } 
            },
            { status: 403 }
          )
        }
      }
    }
    
    // Add user info to request headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-role', user.role)
    response.headers.set('x-user-email', user.email)
    if (user.department) {
      response.headers.set('x-user-department', user.department)
    }
    
    return response
  } catch (error) {
    console.error('JWT verification failed:', error)
    return redirectToLogin(request)
  }
}

function getRoutePermission(pathname: string): { resource: string; action: string } | null {
  // Check exact matches first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname]
  }
  
  // Check pattern matches for dynamic routes
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      return permission
    }
  }
  
  // Special handling for HTTP methods in API routes
  const method = pathname.split('/').pop()
  if (pathname.includes('/api/assets/') && pathname.includes('/transfer')) {
    return { resource: 'assets', action: 'update' }
  }
  if (pathname.includes('/api/assets/') && pathname.includes('/verify')) {
    return { resource: 'assets', action: 'update' }
  }
  if (pathname.includes('/api/workflows/') && pathname.includes('/approve')) {
    return { resource: 'workflows', action: 'approve' }
  }
  
  return null
}

function redirectToLogin(request: NextRequest) {
  // For API routes, return 401 instead of redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { 
        error: { 
          message: 'Authentication required', 
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString()
        } 
      },
      { status: 401 }
    )
  }

  // For page routes, redirect to login
  const loginUrl = new URL('/', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}