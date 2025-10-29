
import { NextRequest, NextResponse } from 'next/server';
import { authService } from './auth-service';
import { ApiError } from './api-utils';
import { RBACService, validateRouteAccess, AuthContext } from './rbac';
import { JWTPayload } from '@/types/auth';

interface MiddlewareOptions {
  resource: string;
  action: string;
  requireDepartment?: boolean;
}

// Main authentication middleware
export async function authMiddleware(request: NextRequest): Promise<{ user: JWTPayload | null, response: NextResponse | null }> {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return { user: null, response: NextResponse.json({ error: 'Unauthorized', message: 'No authentication token found' }, { status: 401 }) };
    }

    const userPayload = await authService.verifyToken(token);
    
    // Check user actively exists and is active in DB (optional, but good for security)
    // For now, trust JWT payload as source of truth

    if (!userPayload) {
      return { user: null, response: NextResponse.json({ error: 'Unauthorized', message: 'Invalid authentication token' }, { status: 401 }) };
    }

    return { user: userPayload, response: null };
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return { user: null, response: NextResponse.json({ error: 'Authentication failed', message: error.message }, { status: 401 }) };
  }
}

// Generic middleware wrapper with RBAC
function createRBACMiddleware(handler: Function, options: MiddlewareOptions) {
  return async (request: NextRequest, context: any) => {
    const { user, response } = await authMiddleware(request);
    if (response) {
        return response; // Authentication failed
    }
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized', message: 'User not found after authentication' }, { status: 401 });
    }

    const validation = await validateRouteAccess(user, options);

    if (!validation.allowed) {
      return NextResponse.json({ error: 'Forbidden', message: validation.reason }, { status: 403 });
    }

    // Pass user and auth context to the handler
    const authContext: AuthContext = {
      user,
      hasPermission: (resource: string, action: string) => RBACService.hasPermission(user.role_id, resource, action),
      canAccessDepartment: (departmentId: number) => RBACService.canAccessDepartment(user.role as any, user.department_id, departmentId),
      getDepartmentFilter: () => RBACService.getDepartmentFilter(user.role as any, user.department_id)
    };

    return handler(request, { ...context, user: user, authContext });
  };
}

// Specific middleware functions
export function withApiMiddleware(handler: Function) {
  // This is a basic auth check for any authenticated user
  return createRBACMiddleware(handler, { resource: 'any', action: 'read' });
}

export function withAdminOnly(handler: Function) {
  return createRBACMiddleware(handler, { resource: 'admin', action: 'access' });
}

export function withUserManagement(handler: Function, action: string) {
  return createRBACMiddleware(handler, { resource: 'users', action: action });
}

export function withAssetAccess(handler: Function, action: string) {
  return createRBACMiddleware(handler, { resource: 'assets', action: action, requireDepartment: true });
}

export function withReportAccess(handler: Function, action: string) {
  return createRBACMiddleware(handler, { resource: 'reports', action: action, requireDepartment: true });
}

export function withAuth(handler: Function) {
  // For routes that just need any authenticated user, no specific RBAC check
  return createRBACMiddleware(handler, { resource: 'auth', action: 'access' });
}

export function withWorkflowAccess(handler: Function, action: string) {
  return createRBACMiddleware(handler, { resource: 'workflows', action: action, requireDepartment: true });
}

export async function verifyAuth(request: NextRequest) {
  const { user, response } = await authMiddleware(request);
  if (response) {
    return response;
  }
  return user; // Return the user payload if authenticated
}

export { authMiddleware as default };