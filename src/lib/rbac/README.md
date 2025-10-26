# Role-Based Access Control (RBAC) System

This document describes the RBAC system implementation for the KTI Assets application.

## Overview

The RBAC system provides fine-grained access control based on user roles and department assignments. It supports three main roles:

- **Admin**: Full access to all features and departments
- **SPOC**: Department-specific access with approval permissions
- **User**: Read-only access to department data

## Core Components

### 1. RBAC Service (`src/lib/rbac.ts`)

The main service that handles permission checking and validation.

```typescript
import { RBACService } from '@/lib/rbac'

// Check if user has permission
const canCreate = RBACService.hasPermission('admin', 'assets', 'create')

// Check department access
const canAccess = RBACService.canAccessDepartment('spoc', 'IT', 'IT')

// Get department filter for queries
const filter = RBACService.getDepartmentFilter('user', 'HR')
```

### 2. Authentication Middleware (`src/lib/auth-middleware.ts`)

Provides middleware functions for protecting API routes.

```typescript
import { withAuth, withAssetAccess } from '@/lib/auth-middleware'

// Basic authentication
export const GET = withAuth(handler)

// Resource-specific access
export const GET = withAssetAccess(handler, 'read')
export const POST = withAssetAccess(handler, 'create')
```

### 3. Department Filtering (`src/lib/department-filter.ts`)

Handles department-based data filtering for database queries.

```typescript
import { DepartmentFilterService } from '@/lib/department-filter'

// Apply department filter to query
const filteredQuery = DepartmentFilterService.filterAssetQuery(query, user)

// Validate department access
const validation = DepartmentFilterService.validateDepartmentAccess(
  'IT', user, 'create asset'
)
```

### 4. React Hooks (`src/hooks/usePermissions.ts`)

Provides hooks for permission checking in React components.

```typescript
import { usePermissions, useHasPermission } from '@/hooks/usePermissions'

function MyComponent() {
  const { user, hasPermission } = usePermissions()
  const canEdit = useHasPermission('assets', 'update')
  
  return (
    <div>
      {canEdit && <EditButton />}
    </div>
  )
}
```

### 5. Permission Gates (`src/components/auth/PermissionGate.tsx`)

React components for conditional rendering based on permissions.

```typescript
import { PermissionGate, AdminOnly } from '@/components/auth/PermissionGate'

function MyComponent() {
  return (
    <div>
      <PermissionGate resource="assets" action="create">
        <CreateAssetButton />
      </PermissionGate>
      
      <AdminOnly>
        <AdminPanel />
      </AdminOnly>
    </div>
  )
}
```

## Role Permissions

### Admin Role
- **Assets**: create, read, update, delete
- **Workflows**: create, read, update, delete, approve
- **Reports**: read, export
- **Masters**: create, read, update, delete
- **Users**: create, read, update, delete
- **Departments**: access all departments

### SPOC Role
- **Assets**: read, update (department only)
- **Workflows**: create, read, approve (department only)
- **Reports**: read (department only)
- **Departments**: access assigned department only

### User Role
- **Assets**: read (department only)
- **Workflows**: read (own workflows only)
- **Reports**: read (department only)
- **Departments**: access assigned department only

## Usage Examples

### API Route Protection

```typescript
// src/app/api/assets/route.ts
import { withAssetAccess } from '@/lib/auth-middleware'
import { DepartmentFilterService } from '@/lib/department-filter'

async function getAssetsHandler(request: NextRequest, user: JWTPayload) {
  // Apply department filtering
  const query = DepartmentFilterService.filterAssetQuery({}, user)
  
  // Fetch assets with proper filtering
  const assets = await assetService.findAssets(query)
  
  return createSuccessResponse(assets)
}

// Protect route with asset read permission
export const GET = withAssetAccess(getAssetsHandler, 'read')
```

### React Component with Permissions

```typescript
// src/components/AssetList.tsx
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGate } from '@/components/auth/PermissionGate'

export function AssetList() {
  const { user, getDepartmentFilter } = usePermissions()
  
  return (
    <div>
      <h1>Assets</h1>
      
      <PermissionGate resource="assets" action="create">
        <CreateAssetButton />
      </PermissionGate>
      
      <AssetTable departmentFilter={getDepartmentFilter()} />
    </div>
  )
}
```

### Department-Specific Data Access

```typescript
// src/lib/asset-service.ts
import { DepartmentFilterService } from '@/lib/department-filter'

export class AssetService {
  async getAssets(user: JWTPayload, filters: any = {}) {
    // Apply department filtering based on user role
    const query = DepartmentFilterService.filterAssetQuery(filters, user)
    
    return await this.collection.find(query).toArray()
  }
  
  async updateAsset(id: string, updates: any, user: JWTPayload) {
    // Get existing asset
    const asset = await this.collection.findOne({ _id: id })
    
    // Check department access
    if (!DepartmentFilterService.canAccessAsset(asset, user)) {
      throw new Error('Access denied to asset')
    }
    
    return await this.collection.updateOne({ _id: id }, { $set: updates })
  }
}
```

## Middleware Integration

The RBAC system integrates with the existing Next.js middleware to provide route-level protection:

```typescript
// src/middleware.ts
import { RBACService } from '@/lib/rbac'

export async function middleware(request: NextRequest) {
  // ... existing auth logic ...
  
  // Check route-specific permissions
  const routePermission = getRoutePermission(request.nextUrl.pathname)
  
  if (routePermission) {
    const hasPermission = RBACService.hasPermission(
      user.role,
      routePermission.resource,
      routePermission.action
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
}
```

## Testing

The RBAC system includes comprehensive tests:

```bash
# Run RBAC tests
npm test src/lib/__tests__/rbac.test.ts
```

## Best Practices

1. **Always use middleware**: Protect API routes with appropriate middleware functions
2. **Apply department filtering**: Use `DepartmentFilterService` for database queries
3. **Check permissions in UI**: Use `PermissionGate` components for conditional rendering
4. **Validate department access**: Always validate department access for cross-department operations
5. **Use typed interfaces**: Leverage TypeScript for type safety with `JWTPayload` and role types

## Migration from Legacy System

To migrate existing API routes:

1. Replace `withApiMiddleware` with resource-specific middleware:
   ```typescript
   // Old
   export const GET = withApiMiddleware(handler)
   
   // New
   export const GET = withAssetAccess(handler, 'read')
   ```

2. Add department filtering to handlers:
   ```typescript
   // Add department filtering
   const query = DepartmentFilterService.filterAssetQuery(baseQuery, user)
   ```

3. Update UI components to use permission gates:
   ```typescript
   // Wrap conditional elements
   <PermissionGate resource="assets" action="create">
     <CreateButton />
   </PermissionGate>
   ```

## Security Considerations

- All permissions are checked server-side
- Department filtering is applied at the database level
- JWT tokens include role and department information
- Middleware validates permissions before route execution
- UI components provide user experience but rely on server-side enforcement